import type { IPluginContext } from '@tarojs/service'
import type { PathData } from 'webpack'
import fs from 'fs'
import path from 'path'
import { RawSource } from 'webpack-sources'
import { transformWebpackRuntime } from './transform-webpack-runtime'
import { TransformOpt, TransformBeforeCompressionPlugin, PLUGIN_NAME as TransformBeforeCompressionPluginName } from './transform-before-compression-plugin'
import { InjectStyleComponentPlugin, PLUGIN_NAME as InjectStyleComponentPluginName, InjectStyleComponentName } from './inject-style-component'
import { transformAppConfig } from './transform-app-config'
import { transformPagesWXml } from './transform-pages-wxml'
import { generateDynamicPackageName, generateKeyByOrder, hashModBigInt, isDynamicPackageName } from './utils'
import { AsyncPackOpts } from './types'

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
      test: /^(runtime\.js)$/,
      transform: (opt: TransformOpt) => {
        const { source, assets } = opt
        const transformOpts = { ...finalOpts, assets }
        return transformWebpackRuntime(source as string, transformOpts)
      }
    }])

    chain.plugin(InjectStyleComponentPluginName).use(InjectStyleComponentPlugin, [finalOpts])
  })

  ctx.modifyBuildAssets(({ assets }) => {
    const hasDynamicModule = Object.keys(assets).some((key) => isDynamicPackageName(finalOpts.dynamicPackageNamePrefix, key))

    if (!hasDynamicModule) return

    const asyncComponents = (() => {
      if (finalOpts.dynamicPackageCount <= 1) { return { [InjectStyleComponentName]: `${generateDynamicPackageName(finalOpts)}/${InjectStyleComponentName}` } }
      return new Array(finalOpts.dynamicPackageCount).fill(null).reduce((result, _, order) => {
        const dynamicPackageName = generateDynamicPackageName({ ...finalOpts, order })
        const componentName = `${InjectStyleComponentName}-${generateKeyByOrder(order)}`
        return { ...result, [componentName]: `${dynamicPackageName}/${InjectStyleComponentName}` }
      }, {})
    })()

    const filePath = path.resolve(__dirname, './singleton-promise.js')

    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })

    assets['singleton-promise.js'] = new RawSource(fileContent)

    transformAppConfig({ ...finalOpts, assets, asyncComponents })

    transformPagesWXml({ assets, asyncComponents })
  })
}
