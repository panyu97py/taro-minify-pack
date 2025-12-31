import { NodePath, template } from '@babel/core'
import generator from '@babel/generator'
import * as parser from '@babel/parser'
import traverse, { Node } from '@babel/traverse'
import * as types from '@babel/types'
import type { AssignmentExpression, VariableDeclarator } from '@babel/types'
import type { CompilationAssets, AsyncPackOpts } from './types'

interface Opts extends AsyncPackOpts {
  assets: CompilationAssets;
}

const webpackLoadDynamicModuleTemplateDep = `
  var loadedDynamicModules = {};
  console.log({hasStyleDynamicModuleList})
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
    
    const { SingletonPromise } = require('~/singleton-promise.js');
    
    const waitStyle = hasStyleDynamicModuleList.includes(dynamicModulePath)?SingletonPromise.wait():Promise.resolve()
    
    waitStyle.then(()=>{
      promiseRetry(function () {
        return loadDynamicModule(dynamicModulePath)
      })
      .then(function () {
        return done({ type: 'loaded', target })
      }).catch(function () {
        return done({ type:'error', target })
      });
    })
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

  const { assets, dynamicPackageName } = opts

  const dynamicJsAssets = Object.keys(assets).filter((assetName) => {
    return new RegExp(`^${dynamicPackageName}/.*\\.js$`).test(assetName)
  })

  const dynamicWXssAssets = Object.keys(assets).filter((assetName) => {
    return new RegExp(`^${dynamicPackageName}/.*\\.wxss$`).test(assetName)
  })

  const loadDynamicModuleFnMapCode = (() => {
    const dynamicAssetsRequireTempCode = dynamicJsAssets.map((dynamicJsAsset) => {
      return `'/${dynamicJsAsset}':function (){ return require.async('${dynamicJsAsset}'); }`
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

  const templateCodeAst = template.ast(webpackLoadDynamicModuleTemplate)

  const templateCodeDepAst = template.ast(webpackLoadDynamicModuleTemplateDep)

  const loadDynamicModuleFnMapAst = template.ast(loadDynamicModuleFnMapCode)

  const hasStyleDynamicAssetsListAst = template.ast(hasStyleDynamicAssetsListCode)

  assignmentExpressionNodePath.replaceWith(templateCodeAst as Node)

  assignmentExpressionNodePath.insertBefore(hasStyleDynamicAssetsListAst)

  assignmentExpressionNodePath.insertBefore(loadDynamicModuleFnMapAst)

  assignmentExpressionNodePath.insertBefore(templateCodeDepAst)
}

const webpackLoadDynamicModuleStylesheetTemplate = `
loadStylesheet = function () {
  return Promise.resolve()
}
`

const replaceLoadStylesheetFn = (nodePath: NodePath<VariableDeclarator>) => {
  const { id, init } = nodePath.node || {}
  if (!types.isIdentifier(id, { name: 'loadStylesheet' })) return
  if (!types.isFunctionExpression(init)) return
  const isProcessed = !init.params.length
  if (isProcessed) return
  const templateCodeAst = template.expression(webpackLoadDynamicModuleStylesheetTemplate)()
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
    },
    VariableDeclarator (nodePath: NodePath<VariableDeclarator>) {
      replaceLoadStylesheetFn(nodePath)
      removeCreateStylesheetFn(nodePath)
      removeFindStylesheetFn(nodePath)
    }
  })
  return generator(ast).code
}
