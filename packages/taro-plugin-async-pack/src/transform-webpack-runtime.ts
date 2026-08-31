import { NodePath, template } from '@babel/core'
import generator from '@babel/generator'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as types from '@babel/types'
import type {
  AssignmentExpression,
  Statement, UnaryExpression
} from '@babel/types'
import type { CompilationAssets, AsyncPackOpts } from './types'
import { isDynamicPackageAsset, matchSuffix } from './utils'

interface Opts extends AsyncPackOpts {
  assets: CompilationAssets;
}

const webpackLoadDynamicModuleTemplateDep = `
  var loadedDynamicModules = {};
  var loadDynamicModule = function (dynamicModulePath) {
    var loadDynamicModuleFn = loadDynamicModuleFnMap[dynamicModulePath];
    return loadDynamicModuleFn ? loadDynamicModuleFn() : Promise.reject();
  };
  var promiseRetry = function (apply,retries = 6,delay = 500) {
    return apply().catch(function (error) {
      if (retries <= 0) return Promise.reject(error);
      return new Promise(function (resolve) {
          setTimeout(resolve, delay);
       })
       .then(function () {
          return promiseRetry(apply, retries - 1, delay)
       });
    })
  }
`

const webpackLoadDynamicModuleTemplate = `
  __webpack_require__.l = function (dynamicModulePath, done, key, chunkId) {
    if (inProgress[dynamicModulePath]) {
      inProgress[dynamicModulePath].push(done);
      return;
    }
    
    const target = { src: dynamicModulePath };

    if (loadedDynamicModules[dynamicModulePath]) return done({ type: 'loaded', target });

    promiseRetry(function () {
      return loadDynamicModule(dynamicModulePath)
    }).then(function () {
      return done({ type: 'loaded', target })
    }).catch(function () {
      return done({ type:'error', target })
    });
  };
`

const replaceWebpackLoadScriptFn = (assignmentExpressionNodePath: NodePath<AssignmentExpression>, opts: Opts) => {
  const { left, right } = assignmentExpressionNodePath.node || {}

  if (!types.isMemberExpression(left)) return

  // webpack5 的 loadScript 在产物中可能是 FunctionExpression 或 ArrowFunctionExpression（受
  // output.environment.arrowFunction 影响，Taro 3.6.x 默认产物为箭头函数），二者都需命中
  if (!types.isFunction(right)) return

  if (!types.isIdentifier(left.object, { name: '__webpack_require__' })) return

  if (!types.isIdentifier(left.property, { name: 'l' })) return

  const isProcessed = right.params.some((item) => {
    return types.isIdentifier(item, { name: 'dynamicModulePath' })
  })

  if (isProcessed) return

  const { assets } = opts

  const dynamicJsAssets = Object.keys(assets).filter((assetName) => {
    return isDynamicPackageAsset(opts, assetName) && matchSuffix('js', assetName)
  })

  const loadDynamicModuleFnMapCode = (() => {
    const dynamicAssetsRequireTempCode = dynamicJsAssets.map((dynamicJsAsset) => {
      return `'/${dynamicJsAsset}':function (){ return require.async('~/${dynamicJsAsset}'); }`
    })

    return `var loadDynamicModuleFnMap = {${dynamicAssetsRequireTempCode.join(',')}}`
  })()

  const templateCodeAst = template.ast(webpackLoadDynamicModuleTemplate) as Statement

  const loadDynamicModuleFnMapAst = template.ast(loadDynamicModuleFnMapCode)

  const templateCodeDepAst = template.ast(webpackLoadDynamicModuleTemplateDep)

  assignmentExpressionNodePath.replaceWith(templateCodeAst)

  assignmentExpressionNodePath.insertBefore(loadDynamicModuleFnMapAst)

  assignmentExpressionNodePath.insertBefore(templateCodeDepAst)

  return true
}

const webpackLoadDynamicStylesheetTemplate = `
  !function () {
    var loadStylesheet = function (_chunkId) {
      return Promise.resolve()
    }
    __webpack_require__.f.miniCss = function (dynamicStylesheetChunkId, promises) {
      promises.push(loadStylesheet(dynamicStylesheetChunkId));
    };
  }();
`

const replaceWebpackLoadDynamicModuleStylesheetFn = (path: NodePath<UnaryExpression>, opts: Opts) => {
  let needProcessed = false

  path.traverse({
    AssignmentExpression: (nodePath: NodePath<AssignmentExpression>) => {
      const { left, right } = nodePath.node || {}

      if (!types.isMemberExpression(left)) return

      if (!types.isFunction(right)) return

      if (!types.isMemberExpression(left.object)) return

      if (!types.isIdentifier(left.object.object, { name: '__webpack_require__' })) return

      if (!types.isIdentifier(left.object.property, { name: 'f' })) return

      if (!types.isIdentifier(left.property, { name: 'miniCss' })) return

      if (right.params.some((item) => types.isIdentifier(item, { name: 'dynamicStylesheetChunkId' }))) return

      needProcessed = true
    }
  })

  if (!needProcessed) return

  const templateCodeAst = template.ast(webpackLoadDynamicStylesheetTemplate)

  path.parentPath.replaceWith(templateCodeAst as Statement)
}

export const transformWebpackRuntime = (code: string, opts: Opts) => {
  const ast = parser.parse(code) // 将代码解析为 AST

  let loadScriptMatched = false

  traverse(ast, {
    UnaryExpression: (nodePath: NodePath<UnaryExpression>) => {
      replaceWebpackLoadDynamicModuleStylesheetFn(nodePath, opts)
    },
    AssignmentExpression: (nodePath: NodePath<AssignmentExpression>) => {
      const matched = replaceWebpackLoadScriptFn(nodePath, opts)

      loadScriptMatched = loadScriptMatched || !!matched
    }
  })

  const hasDynamicJsAssets = Object.keys(opts.assets).some((assetName) => {
    return isDynamicPackageAsset(opts, assetName) && matchSuffix('js', assetName)
  })

  // fail loud：配置了动态分包但 runtime 的 loadScript 未被替换时，异步 chunk 会退回
  // 浏览器 script 注入（document.createElement），在微信小程序环境必然加载失败，
  // 且该失败发生在真机运行时，构建期无任何报错——必须在构建期显式暴露
  if (hasDynamicJsAssets && !loadScriptMatched) {
    console.warn(
      '[taro-plugin-async-pack] 未能在 runtime.js 中匹配 __webpack_require__.l（loadScript）赋值，' +
        '异步 chunk 加载将退回浏览器实现，在微信小程序环境会运行时失败。' +
        '已知 workaround：webpackChain 中设置 output.environment.arrowFunction = false，' +
        '使 runtime 降为普通函数形态；或将你的 Taro/webpack 版本与插件兼容矩阵对照确认。'
    )
  }

  return generator(ast).code
}
