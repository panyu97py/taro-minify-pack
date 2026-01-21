export interface BundleAnalyzerOpt {
    /**
     * Host that will be used in `server` mode to start HTTP server.
     * @default '127.0.0.1'
     */
    analyzerHost?: string | undefined;

    /**
     * Port that will be used in `server` mode to start HTTP server.
     * @default 8888
     */
    analyzerPort?: number | 'auto' | undefined;

    /**
     * Automatically open report in default browser.
     * @default true
     */
    openAnalyzer?: boolean | undefined;
}
