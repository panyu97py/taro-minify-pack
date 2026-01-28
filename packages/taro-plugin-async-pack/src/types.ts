import { Source } from 'webpack-sources'

export interface AsyncPackOpts {
    framework: 'react' | 'vue',
    dynamicPackageNamePrefix: string;
    dynamicPackageCount: number;
}

export type CompilationAssets = Record<string, Source>;
