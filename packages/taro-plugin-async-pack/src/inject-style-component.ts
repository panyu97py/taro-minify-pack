import { Compiler, Compilation } from 'webpack'
import path from 'path'
import { AsyncPackOpts } from './types'
import { RawSource } from 'webpack-sources'

export const PLUGIN_NAME = 'InjectStyleComponent'

export const InjectStyleComponentName = 'inject-style'

type Opt = AsyncPackOpts

export class InjectStyleComponentPlugin {
  private readonly opt: Opt

  private readonly WXmlContent: string = '<block/>'

  private readonly JsonContent:string = '{"component": true,"styleIsolation": "shared"}'

  private readonly JsContent: string = 'Component({})'

  constructor (opt: Opt) {
    this.opt = opt
  }

  apply (compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL // 最早阶段，在优化前

      compilation.hooks.processAssets.tap({ name: PLUGIN_NAME, stage }, (assets) => {
        const { customDynamicPackages } = this.opt
        customDynamicPackages.forEach(customDynamicPackageItem => {
          const { name: customDynamicPackageName, asyncStyle } = customDynamicPackageItem

          if (!asyncStyle) return

          const styleFileContent = Object.keys(assets).reduce((result, assetPath) => {
            if (!new RegExp(`^${customDynamicPackageName}\\/.*\\.wxss$`).test(assetPath)) return result
            const relativePath = path.posix.relative(customDynamicPackageName, assetPath)
            const code = `@import './${relativePath}';`
            return result + code + '\n'
          }, '')

          const componentPath = `${customDynamicPackageName}/${InjectStyleComponentName}`
          compilation.assets[`${componentPath}.wxss`] = new RawSource(styleFileContent)
          compilation.assets[`${componentPath}.wxml`] = new RawSource(this.WXmlContent)
          compilation.assets[`${componentPath}.json`] = new RawSource(this.JsonContent)
          compilation.assets[`${componentPath}.js`] = new RawSource(this.JsContent)
        })
      })
    })
  }
}
