import { NodePath, template } from '@babel/core'
import generator from '@babel/generator'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as types from '@babel/types'
import type {
  AssignmentExpression,
  ObjectMethod,
  ObjectProperty,
  SpreadElement,
  Statement,
  VariableDeclarator
} from '@babel/types'
import type { CompilationAssets, AsyncPackOpts } from './types'
import { isDynamicPackageJsAsset, isDynamicPackageWXssAsset } from './utils'

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

  if (!types.isFunctionExpression(right)) return

  if (!types.isIdentifier(left.object, { name: '__webpack_require__' })) return

  if (!types.isIdentifier(left.property, { name: 'l' })) return

  const isProcessed = right.params.some((item) => {
    return types.isIdentifier(item, { name: 'dynamicModulePath' })
  })

  if (isProcessed) return

  const { assets, dynamicPackageNamePrefix } = opts

  const dynamicJsAssets = Object.keys(assets).filter((assetName) => {
    return isDynamicPackageJsAsset(dynamicPackageNamePrefix, assetName)
  })

  const dynamicWXssAssets = Object.keys(assets).filter((assetName) => {
    return isDynamicPackageWXssAsset(dynamicPackageNamePrefix, assetName)
  })

  const loadDynamicModuleFnMapCode = (() => {
    const dynamicAssetsRequireTempCode = dynamicJsAssets.map((dynamicJsAsset) => {
      return `'/${dynamicJsAsset}':function (){ return require.async('~/${dynamicJsAsset}'); }`
    })

    return `var loadDynamicModuleFnMap = {${dynamicAssetsRequireTempCode.join(',')}}`
  })()

  const hasStyleDynamicAssetsListCode = (() => {
    const hasStyleDynamicAssetsList = dynamicJsAssets.filter((dynamicJsAsset) => {
      const matchWXssAssets = dynamicJsAsset.replace(/\.js$/, '.wxss')
      return dynamicWXssAssets.includes(matchWXssAssets)
    })
    return `var hasStyleDynamicModuleList = [${hasStyleDynamicAssetsList.map(item => `'/${item}'`).join(',')}]`
  })()

  const templateCodeAst = template.ast(webpackLoadDynamicModuleTemplate) as Statement

  const loadDynamicModuleFnMapAst = template.ast(loadDynamicModuleFnMapCode)

  const hasStyleDynamicAssetsListAst = template.ast(hasStyleDynamicAssetsListCode)

  const templateCodeDepAst = template.ast(webpackLoadDynamicModuleTemplateDep)

  assignmentExpressionNodePath.replaceWith(templateCodeAst)

  assignmentExpressionNodePath.insertBefore(loadDynamicModuleFnMapAst)

  assignmentExpressionNodePath.insertBefore(hasStyleDynamicAssetsListAst)

  assignmentExpressionNodePath.insertBefore(templateCodeDepAst)
}

const webpackLoadDynamicStylesheetTemplate = `
  __webpack_require__.f.miniCss = function (dynamicStylesheetChunkId, promises) {
    var cssChunks = CSS_CHUNKS;
    if(installedCssChunks[dynamicStylesheetChunkId] !== 0 && cssChunks[dynamicStylesheetChunkId]){
      promises.push(loadStylesheet(dynamicStylesheetChunkId))
    }
  }
`

const replaceWebpackLoadDynamicModuleStylesheetFn = (
  assignmentExpressionNodePath: NodePath<AssignmentExpression>
) => {
  const { left, right } = assignmentExpressionNodePath.node || {}

  if (!types.isMemberExpression(left)) return

  if (!types.isFunctionExpression(right)) return

  if (!types.isMemberExpression(left.object)) return

  if (!types.isIdentifier(left.object.object, { name: '__webpack_require__' })) return

  if (!types.isIdentifier(left.object.property, { name: 'f' })) return

  if (!types.isIdentifier(left.property, { name: 'miniCss' })) return

  const isProcessed = right.params.some((item) => {
    return types.isIdentifier(item, { name: 'dynamicStylesheetChunkId' })
  })

  if (isProcessed) return

  const cssChunksValueAst: Array<ObjectMethod | ObjectProperty | SpreadElement> = []

  assignmentExpressionNodePath.traverse({
    VariableDeclarator: (nodePath: NodePath<VariableDeclarator>) => {
      const { id, init } = nodePath.node || {}
      if (!types.isIdentifier(id, { name: 'cssChunks' })) return
      if (!types.isObjectExpression(init)) return
      cssChunksValueAst.push(...init.properties)
    }
  })

  const CSS_CHUNKS = types.objectExpression(cssChunksValueAst)

  const templateCodeAst = template.statement(webpackLoadDynamicStylesheetTemplate)({ CSS_CHUNKS })

  assignmentExpressionNodePath.replaceWith(templateCodeAst)
}

const webpackLoadStylesheetTemplate = `
loadStylesheet = function (chunkId) {
  const href = __webpack_require__.miniCssF(chunkId);
  const fullHref = __webpack_require__.p + href;
  const dynamicPackageNameRegex = DYNAMIC_PACKAGE_NAME_REGEX;
  const [,dynamicPackageName] = fullHref.match(dynamicPackageNameRegex) || [];
  const { SingletonPromise } = require('~/singleton-promise.js');
  return SingletonPromise.wait(dynamicPackageName)
}
`

const replaceLoadStylesheetFn = (nodePath: NodePath<VariableDeclarator>, opts: Opts) => {
  const { id, init } = nodePath.node || {}
  if (!types.isIdentifier(id, { name: 'loadStylesheet' })) return
  if (!types.isFunctionExpression(init)) return
  const isProcessed = !init.params.length
  if (isProcessed) return
  const { dynamicPackageNamePrefix } = opts
  const DYNAMIC_PACKAGE_NAME_REGEX = types.regExpLiteral(`(${dynamicPackageNamePrefix}(?:-[a-z]{2})?)\\/`)
  const templateCodeAst = template.expression(webpackLoadStylesheetTemplate)({ DYNAMIC_PACKAGE_NAME_REGEX })
  nodePath.replaceWith(templateCodeAst)
}

const removeCreateStylesheetFn = (nodePath: NodePath<VariableDeclarator>) => {
  const { id } = nodePath.node || {}
  if (!types.isIdentifier(id, { name: 'createStylesheet' })) return
  nodePath.remove()
}

const removeFindStylesheetFn = (nodePath: NodePath<VariableDeclarator>) => {
  const { id } = nodePath.node || {}
  if (!types.isIdentifier(id, { name: 'findStylesheet' })) return
  nodePath.remove()
}

export const transformWebpackRuntime = (code: string, opts: Opts) => {
  const ast = parser.parse(code) // 将代码解析为 AST
  traverse(ast, {
    AssignmentExpression: (nodePath: NodePath<AssignmentExpression>) => {
      replaceWebpackLoadScriptFn(nodePath, opts)
      replaceWebpackLoadDynamicModuleStylesheetFn(nodePath)
    },
    VariableDeclarator (nodePath: NodePath<VariableDeclarator>) {
      replaceLoadStylesheetFn(nodePath, opts)
      removeCreateStylesheetFn(nodePath)
      removeFindStylesheetFn(nodePath)
    }
  })
  return generator(ast).code
}
