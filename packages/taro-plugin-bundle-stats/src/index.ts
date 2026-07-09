import type { IPluginContext } from '@tarojs/service'
import { BundleStatsWebpackPlugin } from 'bundle-stats-webpack-plugin'
import { BundleStatsOpt, BundleStatsReport } from './types'
import got from 'got'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { summarizeReport } from './summarize-report'
import { uploadAssets } from '@taro-minify-pack/helper'
import { AppConfig } from '@tarojs/taro'

export type { BundleStatsOpt } from './types'

const bundleStatsDefaultOpt: BundleStatsOpt = {
  json: true,
  html: true,
  compare: true,
  baseline: true,
  reportPath: 'bundleStatsReport',
  baselinePath: 'baseline.json'
}
export default (ctx: IPluginContext, pluginOpts: Partial<BundleStatsOpt> = {}) => {
  const finalOpts: BundleStatsOpt = { ...bundleStatsDefaultOpt, ...pluginOpts }
  const { reportPath, baselinePath, upload, ...rest } = finalOpts

  ctx.modifyWebpackChain(({ chain }) => {
    const { appPath, outputPath } = ctx.paths
    const outDir = path.relative(outputPath, path.resolve(appPath, reportPath))
    const baselineFilepath = path.resolve(appPath, reportPath, 'baseline.json')
    const config: BundleStatsWebpackPlugin.Options = { ...rest, baselineFilepath, outDir }
    chain.plugin('bundle-stats').use(BundleStatsWebpackPlugin, [config])
  })

  ctx.onBuildStart(async () => {
    const { appPath } = ctx.paths
    const reportDirPath = path.resolve(appPath, reportPath)
    const reportBaselineFilepath = path.resolve(reportDirPath, 'baseline.json')
    if (!baselinePath || baselinePath === reportBaselineFilepath) return
    if (!fs.existsSync(reportDirPath)) fs.mkdirSync(reportDirPath, { recursive: true })
    if (!/https?:\/\//.test(baselinePath)) return fs.copyFileSync(baselinePath, reportBaselineFilepath)
    const stream = got.stream(baselinePath)
    await pipeline(stream, fs.createWriteStream(reportBaselineFilepath))
    console.log(`✨ load baseline.json success. ${reportBaselineFilepath}`)
  })

  ctx.onBuildComplete(() => {
    const { appPath, outputPath } = ctx.paths
    const appConfigPath = path.join(outputPath, 'app.json')
    const bundleStatsReportPath = path.resolve(appPath, reportPath, 'bundle-stats.json')
    if (!fs.existsSync(bundleStatsReportPath) || !fs.existsSync(appConfigPath)) return
    const appConfig: AppConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    const bundleStatsReport: BundleStatsReport = JSON.parse(fs.readFileSync(bundleStatsReportPath, 'utf8'))
    const reportStr = summarizeReport({ appConfig, bundleStatsReport })
    const summaryReportPath = path.resolve(appPath, reportPath, 'summary-report.md')
    fs.writeFileSync(summaryReportPath, reportStr)
    console.log('✨ generate summary-report.md success.')
  })

  ctx.registerCommand({
    name: 'upload-bundle-stats-report',
    async fn () {
      const { appPath } = ctx.paths
      const assetsDirPath = path.resolve(appPath, reportPath)
      if (!fs.existsSync(assetsDirPath)) return console.log('bundle-stats report directory not exists, upload bundle-stats report skipped.')
      if (!upload) return console.log('No upload configuration, upload bundle-stats report skipped.')
      await uploadAssets({ assetsDirPath, upload })
      console.log('✨ upload bundle-stats report success.')
    }
  })
}
