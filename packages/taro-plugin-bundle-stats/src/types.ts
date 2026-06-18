import { Uploader } from '@taro-minify-pack/helper'

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
    uploader?: Uploader,

    /**
     * webpack stats options
     * Default: `{ assets: true, chunks: true, modules: true, hash: true, builtAt: true }`.
     */
    stats?: Partial<WebpackStatsOptions>;
}

export interface MetricRun {
    value: number;
    displayValue: string;
    delta?: number;
    deltaPercentage?: number;
    displayDelta?: string;
    displayDeltaPercentage?: string;
    deltaType?: string;
    regression?: boolean;
}

export interface Metric {
    key: string;
    label: string;
    biggerIsBetter: boolean;
    changed: boolean;
    runs: MetricRun[];
}

export interface BundleStatsReport {
    stats: Metric[];
}
