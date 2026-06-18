import { BaseMetricRun, Metric, SummarizeReportOpt } from './types'

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

/**
 * 格式化
 */
const formatMetric = <T extends BaseMetricRun> (metricList: Metric<T>[]) => {
  return metricList.map(metric => {
    const [current, baseline] = metric?.runs || []
    const { displayDelta, displayDeltaPercentage } = current || {}
    return { ...metric, displayDelta, displayDeltaPercentage, current, baseline }
  })
}

/**
 * 统计
 */
const summaryMetric = <T extends BaseMetricRun> (metric: Metric<T>[]) => {

}

export const summarizeReport = (opt: SummarizeReportOpt) => {
  const { appConfig, bundleStatsReport, focusMetricRun } = opt

  const { subpackages, subPackages } = appConfig
  const subPackageRoots = (subPackages || subpackages || []).map((item) => item.root)

  // 主包资产
  const mainPackageAssets = bundleStatsReport.assets.filter(asset => {
    const { name } = getCurMetricRunInfo(asset)
    const assetName = normalizePath(name || asset.key)
    return !subPackageRoots.some(subPackageRoots => assetName.startsWith(subPackageRoots))
  })

  // 主包资产的 chunkId 列表
  const mainPackageAssetChunkIds = mainPackageAssets.map(asset => getCurMetricRunInfo(asset).chunkId)

  // 主包模块
  const mainPackageModules = bundleStatsReport.modules.filter(module => {
    const { chunkIds } = getCurMetricRunInfo(module)
    return mainPackageAssetChunkIds.some((chunkId) => chunkIds.includes(chunkId))
  })

  // 额外关注的资产
  const focusAssets = bundleStatsReport.assets.filter(asset => {
    const { name } = getCurMetricRunInfo(asset)
    const assetName = normalizePath(name || asset.key)
    return focusMetricRun?.assets?.includes(assetName)
  })

  // 额外关注的资产的 chunkId 列表
  const focusAssetChunkIds = focusAssets.map(asset => getCurMetricRunInfo(asset).chunkId)

  // 额外关注的模块
  const focusModules = bundleStatsReport.modules.filter(module => {
    const { name, chunkIds } = getCurMetricRunInfo(module)
    const isInFocusAssets = focusAssetChunkIds.some((chunkId) => chunkIds.includes(chunkId))
    return isInFocusAssets || focusMetricRun?.modules?.includes(name || module.key)
  })

  // 额外关注的包
  const focusPackages = bundleStatsReport.packages.filter(dependPackage => {
    const { name } = getCurMetricRunInfo(dependPackage)
    return focusMetricRun?.packages?.includes(name || dependPackage.key)
  })

  console.log({ mainPackageModules, mainPackageAssets, focusAssets, focusModules, focusPackages })
}
