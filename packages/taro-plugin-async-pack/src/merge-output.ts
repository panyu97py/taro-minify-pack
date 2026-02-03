import { Compiler, Compilation } from 'webpack'

export const PLUGIN_NAME = 'MergeOutput'

interface MergeOutputOpt {
    test: (assetName: string) => boolean,
    outputFile: string,
}

export class MergeOutputPlugin {
  private readonly opts: MergeOutputOpt

  constructor (opts: MergeOutputOpt) {
    this.opts = opts
  }

  apply (compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL // 最早阶段，在优化前

      compilation.hooks.processAssets.tap({ name: PLUGIN_NAME, stage }, (assets) => {
        const mergedResult = Object.keys(assets).reduce((result, item) => {
          if (!this.opts.test(item)) return result
          const code = assets[item].source().toString()
          delete assets[item]
          return result + code + '\n'
        }, '')

        compilation.assets[this.opts.outputFile!] = new compiler.webpack.sources.RawSource(mergedResult)
      })
    })
  }
}
