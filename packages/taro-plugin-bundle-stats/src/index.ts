import type { IPluginContext } from '@tarojs/service'
import { BundleStatsWebpackPlugin } from 'bundle-stats-webpack-plugin'
import { BundleStatsOpt } from './types'

export default (ctx: IPluginContext, pluginOpts: BundleStatsOpt = {}) => {
  ctx.modifyWebpackChain(({ chain }) => {
    const finalOpts = { ...pluginOpts, defaultSizes: 'parsed', analyzerMode: 'server' } as BundleStatsWebpackPlugin.Options
    chain.plugin('stats').use(BundleStatsWebpackPlugin, [finalOpts])
  })
}
