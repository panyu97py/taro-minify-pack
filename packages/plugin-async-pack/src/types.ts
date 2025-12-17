import { Source } from 'webpack-sources';

export interface DynamicPackOpts {
  dynamicModuleJsDir: string;
  dynamicModuleStyleFile: string;
}

export type CompilationAssets = Record<string, Source>;
