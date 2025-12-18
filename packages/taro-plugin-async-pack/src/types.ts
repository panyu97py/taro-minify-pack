import { Source } from 'webpack-sources'

export interface AsyncPackOpts {
  dynamicModuleJsDir: string;
  dynamicModuleStyleFile: string;
}

export type CompilationAssets = Record<string, Source>;
