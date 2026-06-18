import type { IPluginContext } from '@tarojs/service'
import { BundleStatsWebpackPlugin } from 'bundle-stats-webpack-plugin'
import { BundleStatsOpt, BundleStatsReport } from './types'
import path from 'path'
import fs from 'fs'
import { summarizeReport } from './summarize-report'
import { AppConfig } from '@tarojs/taro'

export type { BundleStatsOpt } from './types'

const bundleStatsDefaultOpt: BundleStatsOpt = {
  reportPath: 'bundleStatsReport',
  baselinePath: 'baseline.json'
}
export default (ctx: IPluginContext, pluginOpts: Partial<BundleStatsOpt> = {}) => {
  const finalOpts: BundleStatsOpt = { ...bundleStatsDefaultOpt, ...pluginOpts }
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
    const { appPath, outputPath } = ctx.paths
    const appConfigPath = path.join(outputPath, 'app.json')
    const appConfig: AppConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    const bundleStatsReportPath = path.resolve(appPath, reportPath, 'bundle-stats.json')
    const bundleStatsReport: BundleStatsReport = JSON.parse(fs.readFileSync(bundleStatsReportPath, 'utf8'))
    summarizeReport({ appConfig, bundleStatsReport })
  })

  ctx.registerCommand({
    name: 'upload-bundle-stats-report',
    async fn () {
      console.log('uploader', uploader)
      // 上传报告到服务器
    }
  })
}
