import { Source } from 'webpack-sources'

export interface AsyncPackOpts {
    dynamicPackageNamePrefix: string;
    dynamicPackageCount: number;
}

export type CompilationAssets = Record<string, Source>;
