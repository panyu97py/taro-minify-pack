import Handlebars from 'handlebars'
import { BaseMetricRun, Metric, SummarizeReportOpt } from './types'
import fs from 'fs'
import path from 'path'

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
 * 获取这次构建的指标
 * @param metric
 */
const getBaselineMetricRunInfo = <T extends BaseMetricRun> (metric?: Metric<T>) => {
  const [_, baselineMetricRun] = metric?.runs || []
  return baselineMetricRun || {}
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

const formatSize = (size: number) => {
  if (Math.abs(size) < 1024) return `${size}B`
  if (Math.abs(size) < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`
  return `${(size / 1024 / 1024).toFixed(2)}MB`
}

/**
 * 统计
 */
const summaryMetric = <T extends BaseMetricRun> (metric: Metric<T>[]) => {
  const currentTotalSize = metric.reduce((result, item) => getCurMetricRunInfo(item).value + result, 0)
  const baselineTotalSize = metric.reduce((result, item) => getBaselineMetricRunInfo(item).value + result, 0)
  const sizeDelta = currentTotalSize - baselineTotalSize
  const displaySizeDelta = formatSize(sizeDelta)
  return { currentTotalSize, baselineTotalSize, sizeDelta, displaySizeDelta }
}

const statisticMetric = <T extends BaseMetricRun> (metric: Metric<T>[]) => {
  const initVal = { currentCount: 0, baselineCount: 0 }
  const { currentCount, baselineCount } = metric.reduce((result, item) => {
    const curMetricRun = getCurMetricRunInfo(item)
    const baselineMetricRun = getBaselineMetricRunInfo(item)
    const currentCount = curMetricRun.value ? result.currentCount + 1 : result.currentCount
    const baselineCount = baselineMetricRun.value ? result.baselineCount + 1 : result.baselineCount
    return { currentCount, baselineCount }
  }, initVal)
  const countDelta = currentCount - baselineCount
  return { currentCount, baselineCount, countDelta }
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

  // 概览
  const mainPackageSummary = (() => {
    const summary = summaryMetric(mainPackageAssets)
    const { currentCount: currentAssetCount, baselineCount: baselineAssetCount, countDelta: assetCountDelta } = statisticMetric(mainPackageAssets)
    const { currentCount: currentModuleCount, baselineCount: baselineModuleCount, countDelta: moduleCountDelta } = statisticMetric(mainPackageModules)
    return { ...summary, currentAssetCount, currentModuleCount, baselineAssetCount, baselineModuleCount, assetCountDelta, moduleCountDelta }
  })()

  const template = fs.readFileSync(path.join(__dirname, './summary-report-template.hbs'), 'utf-8')

  return Handlebars.compile(template)({
    mainPackageSummary,
    mainPackageAssets: formatMetric(mainPackageAssets),
    mainPackageModules: formatMetric(mainPackageModules),
    focusAssets: formatMetric(focusAssets),
    focusModules: formatMetric(focusModules),
    focusPackages: formatMetric(focusPackages)
  })
}
