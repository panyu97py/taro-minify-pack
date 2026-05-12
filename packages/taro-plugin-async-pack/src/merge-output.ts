import { Compiler, Compilation } from 'webpack'

interface MergeOutputOpt {
    test: (assetName: string) => boolean,
    outputFile: string,
}

export class MergeOutputPlugin {
  private readonly opts: MergeOutputOpt

  public static readonly pluginName = 'MergeOutput'

  constructor (opts: MergeOutputOpt) {
    this.opts = opts
  }

  apply (compiler: Compiler) {
    compiler.hooks.compilation.tap(MergeOutputPlugin.pluginName, (compilation: Compilation) => {
      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL // 最早阶段，在优化前

      compilation.hooks.processAssets.tap({ name: MergeOutputPlugin.pluginName, stage }, (assets) => {
        const mergedResult = Object.keys(assets).reduce((result, item) => {
          if (!this.opts.test(item)) return result
          const code = assets[item].source().toString()
          compilation.deleteAsset(item)
          return result + code + '\n'
        }, '')

        compilation.emitAsset(this.opts.outputFile, new compiler.webpack.sources.RawSource(mergedResult))
      })
    })
  }
}
