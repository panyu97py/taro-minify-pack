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
    /**
     * webpack stats options
     * Default: `{ assets: true: true, chunks: true, modules: true, hash: true, builtAt: true }`.
     */
    stats?: Partial<WebpackStatsOptions>;
}
