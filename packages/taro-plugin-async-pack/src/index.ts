import type { IPluginContext } from '@tarojs/service'
import type { Module, PathData } from 'webpack'
import { transformWebpackRuntime } from './transform-webpack-runtime'
import {
  TransformOpt,
  TransformBeforeCompressionPlugin,
  PLUGIN_NAME as TransformBeforeCompressionPluginName
} from './transform-before-compression-plugin'
import {
  InjectStyleComponentPlugin,
  PLUGIN_NAME as InjectStyleComponentPluginName,
  InjectStyleComponentName
} from './inject-style-component'
import { transformAppConfig } from './transform-app-config'
import { transformPagesWXml } from './transform-pages-wxml'
import {
  generateChunkFilename,
  isSyncStyleDynamicPackageAsset, isDynamicPackageAsset,
  matchSuffix, generateCustomDynamicPackageName
} from './utils'
import { AsyncPackOpts } from './types'
import { transformAppStylesheet } from './transform-app-stylesheet'
import { MergeOutputPlugin, PLUGIN_NAME as MergeOutputPluginName } from './merge-output'

export { AsyncPackOpts } from './types'

const dynamicPackOptsDefaultOpt: AsyncPackOpts = {
  dynamicPackageNamePrefix: 'dynamic-package',
  dynamicPackageCount: 1,
  customDynamicPackages: []
}

export default (ctx: IPluginContext, pluginOpts: Partial<AsyncPackOpts>) => {
  const finalOpts = { ...dynamicPackOptsDefaultOpt, ...pluginOpts }

  if (process.env.TARO_ENV !== 'weapp') return

  ctx.modifyWebpackChain(({ chain }) => {
    // 动态获取现有的 splitChunks 配置
    const existingSplitChunks = chain.optimization.get('splitChunks') || {}

    const { common, vendors } = existingSplitChunks.cacheGroups

    const newCommonChunks = common ? { ...common, chunks: 'initial' } : common

    const newVendorsChunks = vendors ? { ...vendors, chunks: 'initial' } : vendors

    const customPackageCacheGroups = finalOpts.customDynamicPackages.reduce((result, item) => {
      const { name: packageName, test } = item
      const customDynamicPackageName = generateCustomDynamicPackageName(finalOpts, packageName)
      const name = (module: Module) => `${customDynamicPackageName}/${module.buildInfo?.hash || module.id}`
      const cacheGroup = { chunks: 'async', test, name }
      return { ...result, [customDynamicPackageName]: cacheGroup }
    }, {})

    chain.optimization.merge({
      splitChunks: {
        ...existingSplitChunks,
        cacheGroups: {
          ...customPackageCacheGroups,
          ...existingSplitChunks.cacheGroups,
          common: newCommonChunks,
          vendors: newVendorsChunks
        }
      }
    })

    chain.merge({
      output: {
        chunkFilename: (pathData: PathData) => generateChunkFilename({ ...finalOpts, pathData, ext: '.js' }),
        path: ctx.paths.outputPath,
        clean: true
      }
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args) => {
        const [options] = args
        const chunkFilename = (pathData: PathData) => generateChunkFilename({ ...finalOpts, pathData, ext: '.wxss' })
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
      test: (assetName: string) => matchSuffix('wxss', assetName) && isSyncStyleDynamicPackageAsset(finalOpts, assetName),
      outputFile: `${finalOpts.dynamicPackageNamePrefix}.wxss`
    }])

    chain.plugin(InjectStyleComponentPluginName).use(InjectStyleComponentPlugin, [finalOpts])
  })

  ctx.modifyBuildAssets(({ assets }) => {
    const hasDynamicModule = Object.keys(assets).some((key) => isDynamicPackageAsset(finalOpts, key))

    if (!hasDynamicModule) return

    const asyncComponents = finalOpts.customDynamicPackages.filter(item => item.asyncStyle).reduce((result, item) => {
      const { name: packageName } = item
      const componentName = `${InjectStyleComponentName}-${packageName}`
      const customDynamicPackageName = generateCustomDynamicPackageName(finalOpts, packageName)
      return { ...result, [componentName]: `${customDynamicPackageName}/${InjectStyleComponentName}` }
    }, {})

    transformAppConfig({ ...finalOpts, assets, asyncComponents })

    transformPagesWXml({ assets, asyncComponents })
  })
}
