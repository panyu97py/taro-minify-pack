import type { IPluginContext } from '@tarojs/service'
import { BundleStatsWebpackPlugin } from 'bundle-stats-webpack-plugin'
import { BundleStatsOpt } from './types'
import path from 'path'

const bundleStatsDefaultOpt: BundleStatsOpt = {
  reportPath: 'bundleStatsReport',
  baselinePath: 'baseline.json'
}
export default (ctx: IPluginContext, pluginOpts: Partial<BundleStatsOpt> = {}) => {
  const finalOpts:BundleStatsOpt = { ...bundleStatsDefaultOpt, ...pluginOpts }

  ctx.modifyWebpackChain(({ chain }) => {
    const { appPath, outputPath } = ctx.paths
    const { reportPath, baselinePath: _, ...rest } = finalOpts
    const outDir = path.relative(outputPath, path.resolve(appPath, reportPath))
    const baselineFilepath = path.resolve(appPath, reportPath, 'baseline.json')
    const config: BundleStatsWebpackPlugin.Options = { ...rest, baselineFilepath, outDir }
    chain.plugin('bundle-stats').use(BundleStatsWebpackPlugin, [config])
  })

  ctx.onBuildStart(() => {
    // 加载baseline文件
  })

  ctx.onBuildComplete(() => {
    // 总结报告
  })
}
