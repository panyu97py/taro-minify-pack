import { Source } from 'webpack-sources'
import type { ChunkGraph, Module, ModuleGraph } from 'webpack'

interface CacheGroupsContext {
    moduleGraph: ModuleGraph;
    chunkGraph: ChunkGraph;
}

interface CustomDynamicPackage {
    name: string
    asyncStyle?: boolean
    test: string | RegExp | ((module: Module, context: CacheGroupsContext) => boolean);
}

export interface AsyncPackOpts {
    dynamicPackageNamePrefix: string;
    dynamicPackageCount: number;
    customDynamicPackages: CustomDynamicPackage[]
}

export type CompilationAssets = Record<string, Source>;
