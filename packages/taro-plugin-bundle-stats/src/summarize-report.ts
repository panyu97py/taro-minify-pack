import { AppConfig } from '@tarojs/taro'
import { BaseMetricRun, BundleStatsReport, Metric } from './types'

/**
 * 共享主资产列表
 */
const sharedMainAssets = new Set(['app.js', 'runtime.js', 'common.js', 'vendors.js'])

/**
 * 页面文件扩展名列表
 */
const pageExtensions = ['.js', '.wxss', '.json', '.wxml']

/**
 * 格式化路径
 */
const normalizePath = (filePath: string) => filePath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '')

/**
 * 获取这次构建的指标
 * @param metric
 */
const getCurMetricRunInfo = <T extends BaseMetricRun> (metric?: Metric<T>) => {
  const [currentMetricRun] = metric?.runs || []
  return currentMetricRun || {}
}

interface SummarizeReportOpt {
    appConfig: AppConfig
    bundleStatsReport: BundleStatsReport
}

export const summarizeReport = (opt: SummarizeReportOpt) => {
  const { appConfig, bundleStatsReport } = opt

  // 主包页面列表
  const { pages: mainPackagePages } = appConfig

  // 主包页面资产
  const mainPackageAssets = bundleStatsReport.assets.filter(asset => {
    const { name } = getCurMetricRunInfo(asset)
    const assetName = normalizePath(name || asset.key)
    const isMainPackagePageAsset = mainPackagePages?.some(page => pageExtensions.some(ext => assetName === `${page}${ext}`))
    const isSharedAsset = sharedMainAssets.has(assetName)
    return isMainPackagePageAsset || isSharedAsset
  })

  // 主包页面资产的 chunkId 列表
  const mainPackageAssetChunkIds = mainPackageAssets.map(asset => getCurMetricRunInfo(asset).chunkId)

  // 主包模块
  const mainPackageModules = bundleStatsReport.modules.filter(module => {
    const { chunkIds } = getCurMetricRunInfo(module)
    return mainPackageAssetChunkIds.some((chunkId) => chunkIds.includes(chunkId))
  })

  console.log({ mainPackageModules, mainPackageAssets })
}
