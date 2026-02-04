import type { IPluginContext } from '@tarojs/service'
import type { PathData } from 'webpack'
import { transformWebpackRuntime } from './transform-webpack-runtime'
import { TransformOpt, TransformBeforeCompressionPlugin, PLUGIN_NAME as TransformBeforeCompressionPluginName } from './transform-before-compression-plugin'
import { transformAppConfig } from './transform-app-config'
import { generateDynamicPackageName, hashModBigInt, isDynamicPackageName, isDynamicPackageWXssAsset } from './utils'
import { AsyncPackOpts } from './types'
import { transformAppStylesheet } from './transform-app-stylesheet'
import { MergeOutputPlugin, PLUGIN_NAME as MergeOutputPluginName } from './merge-output'

export { AsyncPackOpts } from './types'

const dynamicPackOptsDefaultOpt: AsyncPackOpts = {
  dynamicPackageNamePrefix: 'dynamic-common',
  dynamicPackageCount: 1
}

export default (ctx: IPluginContext, pluginOpts: AsyncPackOpts) => {
  const finalOpts = { ...dynamicPackOptsDefaultOpt, ...pluginOpts }

  if (process.env.TARO_ENV !== 'weapp') return

  ctx.modifyWebpackChain(({ chain }) => {
    // 动态获取现有的 splitChunks 配置
    const existingSplitChunks = chain.optimization.get('splitChunks') || {}

    const { common, vendors } = existingSplitChunks.cacheGroups

    const newCommonChunks = common ? { ...common, chunks: 'initial' } : common

    const newVendorsChunks = vendors ? { ...vendors, chunks: 'initial' } : vendors

    const generateChunkFilename = (pathData:PathData, ext:string) => {
      const { chunk } = pathData
      const order = hashModBigInt(chunk?.hash || '', finalOpts.dynamicPackageCount)
      return `${generateDynamicPackageName({ ...finalOpts, order })}/[chunkhash]${ext}`
    }

    chain.optimization.merge({
      splitChunks: {
        ...existingSplitChunks,
        cacheGroups: {
          ...existingSplitChunks.cacheGroups,
          common: newCommonChunks,
          vendors: newVendorsChunks
        }
      }
    })

    chain.merge({
      output: {
        chunkFilename: (pathData:PathData) => generateChunkFilename(pathData, '.js'),
        path: ctx.paths.outputPath,
        clean: true
      }
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args) => {
        const [options] = args
        const chunkFilename = (pathData:PathData) => generateChunkFilename(pathData, '.wxss')
        return [{ ...options, chunkFilename }]
      })

    chain.plugin(TransformBeforeCompressionPluginName).use(TransformBeforeCompressionPlugin, [{
      test: /^(runtime\.js|app\.wxss)$/,
      transform: (opt: TransformOpt) => {
        const { source, assetName, assets } = opt
        const transformOpts = { ...finalOpts, assets }
        if (/^app\.wxss$/.test(assetName)) return transformAppStylesheet(source as string, transformOpts)
        if (/^runtime\.js$/.test(assetName)) return transformWebpackRuntime(source as string, transformOpts)
        return source as string
      }
    }])

    chain.plugin(MergeOutputPluginName).use(MergeOutputPlugin, [{
      test: (assetName: string) => isDynamicPackageWXssAsset(finalOpts.dynamicPackageNamePrefix, assetName),
      outputFile: `${finalOpts.dynamicPackageNamePrefix}.wxss`
    }])
  })

  ctx.modifyBuildAssets(({ assets }) => {
    const hasDynamicModule = Object.keys(assets).some((key) => isDynamicPackageName(finalOpts.dynamicPackageNamePrefix, key))

    if (!hasDynamicModule) return

    transformAppConfig({ ...finalOpts, assets })
  })
}
