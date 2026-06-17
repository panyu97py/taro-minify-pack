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
  const { reportPath, baselinePath, uploader, ...rest } = finalOpts

  ctx.modifyWebpackChain(({ chain }) => {
    const { appPath, outputPath } = ctx.paths
    const outDir = path.relative(outputPath, path.resolve(appPath, reportPath))
    const baselineFilepath = path.resolve(appPath, reportPath, 'baseline.json')
    const config: BundleStatsWebpackPlugin.Options = { ...rest, baselineFilepath, outDir }
    chain.plugin('bundle-stats').use(BundleStatsWebpackPlugin, [config])
  })

  ctx.onBuildStart(() => {
    console.log('baselinePath', baselinePath)
    // 加载baseline文件
  })

  ctx.onBuildComplete(() => {
    // 总结报告
    // 处理数据用  handlebars 解析模版生成报告
  })

  ctx.registerCommand({
    name: 'upload-bundle-stats-report',
    async fn () {
      console.log('uploader', uploader)
      // 上传报告到服务器
    }
  })
}
