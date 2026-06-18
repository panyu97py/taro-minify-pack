import { AppConfig } from '@tarojs/taro'
import { BundleStatsReport } from './types'

interface SummarizeReportOpt {
    appConfig: AppConfig
    bundleStatsReport: BundleStatsReport
}
export const summarizeReport = (opt: SummarizeReportOpt) => {
  console.log({ opt })
}
