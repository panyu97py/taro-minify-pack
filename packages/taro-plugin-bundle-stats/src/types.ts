import { Uploader } from '@taro-minify-pack/helper'
import { AppConfig } from '@tarojs/taro'

interface WebpackStatsOptions {
    /**
     * Output webpack assets information
     * Default: `true`.
     */
    assets?: boolean;

    /**
     * Output webpack chunks information
     * Default: `true`.
     */
    chunks?: boolean;

    /**
     * Output webpack modules information
     * Default: `true`.
     */
    modules?: boolean;

    /**
     * Output webpack hash information
     * Default: `true`.
     */
    hash?: boolean;

    /**
     * Output webpack builtAt information
     * Default: `true`.
     */
    builtAt?: boolean;
}

export interface BundleStatsOpt {
    html?: boolean;
    json?: boolean;
    silent?: boolean;
    compare?: boolean;
    baseline?: boolean;
    baselinePath?: string;
    reportPath: string;
    upload?: Uploader,
    stats?: Partial<WebpackStatsOptions>;
    reportConfig?: Omit<SummarizeReportOpt, 'appConfig'|'bundleStatsReport'>
}

export interface BaseMetricRun {
    value: number;
    displayValue: string;
    delta?: number;
    deltaPercentage?: number;
    displayDelta?: string;
    displayDeltaPercentage?: string;
    deltaType?: string;
    regression?: boolean;
}

export interface AssetMetricRun extends BaseMetricRun {
    name: string
    isChunk: boolean,
    chunkId: string,
}

export interface ModuleMetricRun extends BaseMetricRun {
    name: string
    chunkIds: string[],
}
export interface PackageMetricRun extends BaseMetricRun {
    name: string
}

export interface Metric<T extends BaseMetricRun> {
    key: string;
    label: string;
    biggerIsBetter: boolean;
    changed: boolean;
    runs: T[];
}

export interface BundleStatsReport {
    stats: Metric<BaseMetricRun>[];
    assets: Metric<AssetMetricRun>[];
    modules: Metric<ModuleMetricRun>[];
    packages: Metric<PackageMetricRun>[];
}

export interface FocusMetricRun {
    assets: string[],
    modules: string[],
    packages: string[],
}

export interface SummarizeReportOpt {
    appConfig: AppConfig
    bundleStatsReport: BundleStatsReport
    focusMetricRun?: Partial<FocusMetricRun>,
    displayLimit?: number
}
