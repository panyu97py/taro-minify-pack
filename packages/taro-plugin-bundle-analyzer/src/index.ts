import type { IPluginContext } from '@tarojs/service'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { BundleAnalyzerOpt } from './types'

export type { BundleAnalyzerOpt } from './types'

export default (ctx: IPluginContext, pluginOpts: BundleAnalyzerOpt = {}) => {
  ctx.modifyWebpackChain(({ chain }) => {
    const finalOpts = { ...pluginOpts, defaultSizes: 'parsed', analyzerMode: 'server' } as BundleAnalyzerPlugin.Options
    chain.plugin('analyzer').use(BundleAnalyzerPlugin, [finalOpts])
  })
}
