import webpack from 'webpack'
import { CompilationAssets } from './types'

export interface TransformOpt {
    assetName: string
    source: string | Buffer
    assets: CompilationAssets
}

export interface PluginOpt {
    test?: RegExp;
    transform: (opt: TransformOpt) => string;
}

export const PLUGIN_NAME = 'TransformBeforeCompression'

export class TransformBeforeCompressionPlugin {
  private readonly opt: PluginOpt

  constructor (opt: PluginOpt) {
    this.opt = opt
  }

  apply (compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: webpack.Compilation) => {
      const stage = webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE // 压缩前

      compilation.hooks.processAssets.tap({ name: PLUGIN_NAME, stage }, (assets) => {
        const { test, transform } = this.opt

        const assetNames = Object.keys(assets)

        assetNames.forEach((assetName) => {
          if (!test || !test.test(assetName)) return

          const source = assets[assetName].source()

          const transformResult = transform({ assetName, source, assets } as TransformOpt)

          compilation.updateAsset(assetName, new webpack.sources.RawSource(transformResult))
        })
      })
    })
  }
}
