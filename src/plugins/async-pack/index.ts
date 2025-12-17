import type {IPluginContext} from '@tarojs/service';
import {RawSource} from 'webpack-sources';
import {transformWebpackRuntime} from './transform-webpack-runtime';
import {
  TransformOpt,
  TransformBeforeCompressionPlugin,
  PLUGIN_NAME as TransformBeforeCompressionPluginName,
} from './transform-before-compression-plugin';
import {MergeOutputPlugin, PLUGIN_NAME as MergeOutputPluginName} from './merge-output';
import {DynamicPackOpts} from './types';
import {transformAppStylesheet} from "./transform-app-stylesheet";
import fs from "fs";
import path from "path";

const dynamicPackOptsDefaultOpt: DynamicPackOpts = {
  dynamicModuleJsDir: 'dynamic-common',
  dynamicModuleStyleFile: 'dynamic-common',
};

export default (ctx: IPluginContext, pluginOpts: DynamicPackOpts) => {
  const finalOpts = {...dynamicPackOptsDefaultOpt, ...pluginOpts};

  if (process.env.TARO_ENV !== 'weapp') return;

  ctx.modifyWebpackChain(({chain}) => {

    // 动态获取现有的 splitChunks 配置
    const existingSplitChunks = chain.optimization.get('splitChunks') || {};

    const {common, vendors} = existingSplitChunks.cacheGroups

    const newCommonChunks = common ? {...common, chunks: 'initial'} : common

    const newVendorsChunks = vendors ? {...vendors, chunks: 'initial'} : vendors

    chain.optimization.merge({
      splitChunks: {
        ...existingSplitChunks,
        cacheGroups: {
          ...existingSplitChunks.cacheGroups,
          common: newCommonChunks,
          vendors: newVendorsChunks
        }
      }
    });

    chain.merge({
      output: {
        chunkFilename: `${finalOpts.dynamicModuleJsDir}/[chunkhash].js`, // 异步模块输出路径
        path: ctx.paths.outputPath,
        clean: true,
      },
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args) => {
        const [options] = args;
        const finalOption = {...options, chunkFilename: `${finalOpts.dynamicModuleStyleFile}/[chunkhash].wxss`}
        return [finalOption];
      });

    chain.plugin(TransformBeforeCompressionPluginName).use(TransformBeforeCompressionPlugin, [{
      test: /^(runtime\.js|app\.wxss)$/,
      transform: (opt: TransformOpt) => {
        const {source, assetName, assets} = opt
        const transformOpts = {...finalOpts, assets}
        if (/^app\.wxss$/.test(assetName)) return transformAppStylesheet(source as string, transformOpts);
        if (/^runtime\.js$/.test(assetName)) return transformWebpackRuntime(source as string, transformOpts);
        return source as string
      },
    }]);

    chain.plugin(MergeOutputPluginName).use(MergeOutputPlugin, [{
      test: new RegExp(`^${finalOpts.dynamicModuleStyleFile}\\/.*\\.wxss$`),
      outputFile: `${finalOpts.dynamicModuleStyleFile}.wxss`,
    }]);
  });

  ctx.modifyBuildAssets(({assets}) => {
    const curAppJSON = assets['app.json'];

    if (!curAppJSON) return;

    const curAppJSONContent = JSON.parse(curAppJSON.source());

    const dynamicPackagesConfig = {root: finalOpts.dynamicModuleJsDir, pages: []};

    const hasDynamicModule= (()=>{
      const isDynamicModuleDirExist = fs.existsSync(path.join(ctx.paths.outputPath, finalOpts.dynamicModuleJsDir));
      return isDynamicModuleDirExist && fs.readdirSync(path.join(ctx.paths.outputPath, finalOpts.dynamicModuleJsDir)).length > 0
    })()

    const {resolveAlias = {}, subpackages = []} = curAppJSONContent;

    const newAppJSONContent = {
      ...curAppJSONContent,
      subpackages: hasDynamicModule ? [...subpackages, dynamicPackagesConfig] : subpackages,
      resolveAlias: {
        ...resolveAlias,
        [`${finalOpts.dynamicModuleJsDir}/*`]: `/${finalOpts.dynamicModuleJsDir}/*`,
      },
    };

    assets['app.json'] = new RawSource(JSON.stringify(newAppJSONContent, null, 2));
  });
};
