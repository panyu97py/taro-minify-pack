import { Source } from 'webpack-sources'

export interface AsyncPackOpts {
  dynamicPackageName: string;
}

export type CompilationAssets = Record<string, Source>;
