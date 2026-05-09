import type { IPluginContext } from '@tarojs/service'
import type { Module, PathData } from 'webpack'
import { transformWebpackRuntime } from './transform-webpack-runtime'
import {
  TransformOpt,
  TransformBeforeCompressionPlugin
} from './transform-before-compression-plugin'
import { InjectDynamicStylePlugin } from './inject-dynamic-style'
import { transformAppConfig } from './transform-app-config'
import { transformPagesWXml } from './transform-pages-wxml'
import {
  generateChunkFilename,
  isSyncStyleDynamicPackageAsset, isDynamicPackageAsset,
  matchSuffix, generateCustomDynamicPackageName
} from './utils'
import { AsyncPackOpts } from './types'
import { transformAppStylesheet } from './transform-app-stylesheet'
import { MergeOutputPlugin } from './merge-output'

export * from './types'
export * from './inject-dynamic-style'

const dynamicPackOptsDefaultOpt: AsyncPackOpts = {
  dynamicPackageNamePrefix: 'dynamic-package',
  dynamicPackageCount: 1,
  customDynamicPackages: [],
  onlyCustomDynamicPackages: false,
  strictCustomDynamicPackages: false
}

export default (ctx: IPluginContext, pluginOpts: Partial<AsyncPackOpts>) => {
  const finalOpts = { ...dynamicPackOptsDefaultOpt, ...pluginOpts }

  if (process.env.TARO_ENV !== 'weapp') return

  ctx.modifyWebpackChain(({ chain }) => {
    // 动态获取现有的 splitChunks 配置
    const existingSplitChunks = chain.optimization.get('splitChunks') || {}
    const originalJsChunkFilename = chain.output.get('chunkFilename')

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
        chunkFilename: (pathData: PathData) => generateChunkFilename({
          ...finalOpts,
          pathData,
          ext: '.js',
          originalChunkFilename: originalJsChunkFilename
        }),
        path: ctx.paths.outputPath,
        clean: true
      }
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args) => {
        const [options] = args
        const originalStyleChunkFilename = options.chunkFilename
        const chunkFilename = (pathData: PathData) => generateChunkFilename({
          ...finalOpts,
          pathData,
          ext: '.wxss',
          originalChunkFilename: originalStyleChunkFilename
        })
        return [{ ...options, chunkFilename }]
      })

    chain.plugin(TransformBeforeCompressionPlugin.pluginName).use(TransformBeforeCompressionPlugin, [{
      test: /^(runtime\.js|app\.wxss)$/,
      transform: (opt: TransformOpt) => {
        const { source, assetName, assets } = opt
        const transformOpts = { ...finalOpts, assets }
        if (/^app\.wxss$/.test(assetName)) return transformAppStylesheet(source as string, transformOpts)
        if (/^runtime\.js$/.test(assetName)) return transformWebpackRuntime(source as string, transformOpts)
        return source as string
      }
    }])

    chain.plugin(MergeOutputPlugin.pluginName).use(MergeOutputPlugin, [{
      test: (assetName: string) => {
        const isStyleAsset = matchSuffix('wxss', assetName)
        const isInjectDynamicStyleAsset = new RegExp(`${InjectDynamicStylePlugin.componentName}\\.wxss$`).test(assetName)
        return isStyleAsset && !isInjectDynamicStyleAsset && isSyncStyleDynamicPackageAsset(finalOpts, assetName)
      },
      outputFile: `${finalOpts.dynamicPackageNamePrefix}.wxss`
    }])

    chain.plugin(InjectDynamicStylePlugin.pluginName).use(InjectDynamicStylePlugin, [finalOpts])
  })

  ctx.modifyBuildAssets(({ assets }) => {
    const hasDynamicModule = Object.keys(assets).some((key) => isDynamicPackageAsset(finalOpts, key))

    if (!hasDynamicModule) return

    const asyncComponents = Object.keys(assets).reduce((result, assetName) => {
      const regExp = new RegExp(`^(${finalOpts.dynamicPackageNamePrefix}-([^/]+)/${InjectDynamicStylePlugin.componentName})\\.json$`)
      const [_, fullPathWithoutExt, key] = assetName.match(regExp) || []
      if (!isDynamicPackageAsset(finalOpts, assetName) || !key) return result
      const componentName = `${InjectDynamicStylePlugin.componentName}-${key}`
      return { ...result, [componentName]: fullPathWithoutExt }
    }, {})

    transformAppConfig({ ...finalOpts, assets, asyncComponents })

    transformPagesWXml({ assets, asyncComponents })
  })
}
