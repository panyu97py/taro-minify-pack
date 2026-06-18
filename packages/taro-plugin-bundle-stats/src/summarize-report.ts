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
  const focusAssets = bundleStatsReport.assets.filter(focusAsset => {
    const { name } = getCurMetricRunInfo(focusAsset)
    return focusMetricRun?.assets?.includes(name || focusAsset.key)
  })

  // 额外关注的资产的 chunkId 列表
  const focusAssetChunkIds = focusAssets.map(asset => getCurMetricRunInfo(asset).chunkId)

  // 额外关注的模块
  const focusModules = bundleStatsReport.modules.filter(focusModule => {
    const { name, chunkIds } = getCurMetricRunInfo(focusModule)
    const isInFocusAssets = focusAssetChunkIds.some((chunkId) => chunkIds.includes(chunkId))
    return isInFocusAssets || focusMetricRun?.modules?.includes(name || focusModule.key)
  })

  // 额外关注的包
  const focusPackages = bundleStatsReport.packages.filter(focusPackage => {
    const { name } = getCurMetricRunInfo(focusPackage)
    return focusMetricRun?.packages?.includes(name || focusPackage.key)
  })

  console.log({ mainPackageModules, mainPackageAssets, focusAssets, focusModules, focusPackages })
}
