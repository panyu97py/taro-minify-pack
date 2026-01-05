import { Compiler, Compilation } from 'webpack'
import path from 'path'
import { AsyncPackOpts } from './types'
import template from '@babel/template'
import generator from '@babel/generator'
import { generateDynamicPackageName, isDynamicPackageWXssAssetWithOrder } from './utils'

export const PLUGIN_NAME = 'InjectStyleComponent'

export const InjectStyleComponentName = 'inject-style'

const injectStyleComponentCode = `
const { SingletonPromise } = require('~/singleton-promise.js')
Component({ lifetimes: { attached: () => SingletonPromise.resolve("DYNAMIC_PACKAGE_NAME") } })
`

type Opt = AsyncPackOpts

export class InjectStyleComponentPlugin {
  private readonly opt: Opt

  private readonly WXmlContent: string = '<block/>'

  private readonly JsonContent:string = '{"component": true,"styleIsolation": "shared"}'

  private readonly JsContent: string = injectStyleComponentCode

  constructor (opt: Opt) {
    this.opt = opt
  }

  apply (compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL // 最早阶段，在优化前

      compilation.hooks.processAssets.tap({ name: PLUGIN_NAME, stage }, (assets) => {
        for (let order = 0; order < this.opt.dynamicPackageCount; order++) {
          const dynamicPackageName = generateDynamicPackageName({ ...this.opt, order })

          const { code: jsFileContent } = generator(template.program(this.JsContent)({ DYNAMIC_PACKAGE_NAME: dynamicPackageName }))
          const styleFileContent = Object.keys(assets).reduce((result, assetPath) => {
            if (!isDynamicPackageWXssAssetWithOrder({ ...this.opt, order }, assetPath)) return result
            const relativePath = path.relative(dynamicPackageName, assetPath)
            const code = `@import './${relativePath}';`
            return result + code + '\n'
          }, '')

          const { RawSource } = compiler.webpack.sources
          const componentPath = `${dynamicPackageName}/${InjectStyleComponentName}`
          compilation.assets[`${componentPath}.js`] = new RawSource(jsFileContent)
          compilation.assets[`${componentPath}.wxss`] = new RawSource(styleFileContent)
          compilation.assets[`${componentPath}.wxml`] = new RawSource(this.WXmlContent)
          compilation.assets[`${componentPath}.json`] = new RawSource(this.JsonContent)
        }
      })
    })
  }
}
