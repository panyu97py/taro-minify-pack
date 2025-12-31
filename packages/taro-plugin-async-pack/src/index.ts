import type { IPluginContext } from '@tarojs/service'
import fs from 'fs'
import path from 'path'
import { transformWebpackRuntime } from './transform-webpack-runtime'
import { TransformOpt, TransformBeforeCompressionPlugin, PLUGIN_NAME as TransformBeforeCompressionPluginName } from './transform-before-compression-plugin'
import { InjectStyleComponentPlugin, PLUGIN_NAME as InjectStyleComponentPluginName, InjectStyleComponentName } from './inject-style-component'
import { transformAppConfig } from './transform-app-config'
import { transformPagesWXml } from './transform-pages-wxml'
import { RawSource } from 'webpack-sources'
import { AsyncPackOpts } from './types'

export { AsyncPackOpts } from './types'

const dynamicPackOptsDefaultOpt: AsyncPackOpts = {
  dynamicPackageName: 'dynamic-common'
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
        chunkFilename: `${finalOpts.dynamicPackageName}/[chunkhash].js`, // 异步模块输出路径
        path: ctx.paths.outputPath,
        clean: true
      }
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args) => {
        const [options] = args
        const chunkFilename = `${finalOpts.dynamicPackageName}/[chunkhash].wxss`
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
    const hasDynamicModule = Object.keys(assets).some((key) => key.startsWith(`${finalOpts.dynamicPackageName}/`))

    if (!hasDynamicModule) return

    const asyncComponentPath = `./${InjectStyleComponentPlugin.generateComponentPath(finalOpts)}`

    const asyncComponents = { [InjectStyleComponentName]: asyncComponentPath }

    const filePath = path.resolve(__dirname, './singleton-promise.js')

    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })

    assets['singleton-promise.js'] = new RawSource(fileContent)

    transformAppConfig({ ...finalOpts, assets, asyncComponents })

    transformPagesWXml({ assets, asyncComponents })
  })
}
