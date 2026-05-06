import { Compiler, Compilation } from 'webpack'
import path from 'path'
import { AsyncPackOpts } from './types'
import { RawSource } from 'webpack-sources'
import { generateCustomDynamicPackageName } from './utils'
import { SyncHook } from 'tapable'

export interface InjectDynamicStyleOpt{
  key: string
  stylesheet: string
}

export interface Hooks {
  emitDynamicStyle: SyncHook<InjectDynamicStyleOpt>;
}

type Opt = AsyncPackOpts

export class InjectDynamicStylePlugin {
  private readonly opt: Opt

  private readonly WXmlContent: string = '<block/>'

  private readonly JsonContent:string = '{"component": true,"styleIsolation": "shared"}'

  private readonly JsContent: string = 'Component({})'

  public static readonly pluginName = 'InjectDynamicStyle'

  public static readonly componentName = 'inject-dynamic-style'

  private static readonly hooksMap: WeakMap<Compilation, Hooks> = new WeakMap<Compilation, Hooks>()

  private dynamicStyleMap: Map<string, InjectDynamicStyleOpt> = new Map()

  constructor (opt: Opt) {
    this.opt = opt
  }

  public static getCompilationHooks (compilation: Compilation) {
    if (!this.hooksMap.has(compilation)) {
      const emitDynamicStyle = new SyncHook<InjectDynamicStyleOpt>(['emitDynamicStyleOpt'])
      this.hooksMap.set(compilation, { emitDynamicStyle })
    }
    return this.hooksMap.get(compilation)
  }

  injectDynamicStyleCode (compilation: Compilation, opt:InjectDynamicStyleOpt) {
    const { key, stylesheet } = opt
    const componentPath = `${key}/${InjectDynamicStylePlugin.componentName}`
    compilation.assets[`${componentPath}.wxss`] = new RawSource(stylesheet)
    compilation.assets[`${componentPath}.wxml`] = new RawSource(this.WXmlContent)
    compilation.assets[`${componentPath}.json`] = new RawSource(this.JsonContent)
    compilation.assets[`${componentPath}.js`] = new RawSource(this.JsContent)
  }

  apply (compiler: Compiler) {
    compiler.hooks.compilation.tap(InjectDynamicStylePlugin.pluginName, (compilation: Compilation) => {
      const hooks = InjectDynamicStylePlugin.getCompilationHooks(compilation)

      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL // 最早阶段，在优化前

      hooks?.emitDynamicStyle.tap(InjectDynamicStylePlugin.pluginName, (opt) => this.dynamicStyleMap.set(opt.key, opt))

      compilation.hooks.processAssets.tap({ name: InjectDynamicStylePlugin.pluginName, stage }, (assets) => {
        const { customDynamicPackages } = this.opt

        customDynamicPackages.forEach(customDynamicPackageItem => {
          if (!customDynamicPackageItem.asyncStyle) return

          const customDynamicPackageName = generateCustomDynamicPackageName(this.opt, customDynamicPackageItem.name)

          const styleFileContent = Object.keys(assets).reduce((result, assetPath) => {
            if (!new RegExp(`^${customDynamicPackageName}\\/.*\\.wxss$`).test(assetPath)) return result
            const relativePath = path.posix.relative(customDynamicPackageName, assetPath)
            const code = `@import './${relativePath}';`
            return result + code + '\n'
          }, '')

          this.dynamicStyleMap.set(customDynamicPackageName, { key: customDynamicPackageName, stylesheet: styleFileContent })
        })

        this.dynamicStyleMap.forEach((opt) => this.injectDynamicStyleCode(compilation, opt))
      })
    })
  }
}
