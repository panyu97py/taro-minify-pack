import type {IPluginContext} from '@tarojs/service';
import Taro from '@tarojs/taro';
import {RawSource} from 'webpack-sources';
import {transformWebpackRuntime} from './transform-webpack-runtime';
import {TransformBeforeCompressionPlugin, PLUGIN_NAME, TransformOpt} from './transform-before-compression-plugin';
import {DynamicPackOpts} from './types';
import {transformAppStylesheet} from "./transform-app-stylesheet";
import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const dynamicPackOptsDefaultOpt: DynamicPackOpts = {
  dynamicModuleJsDir: 'dynamic-common',
  dynamicModuleStyleFile: 'dynamic-common',
};

export default (ctx: IPluginContext, pluginOpts: DynamicPackOpts) => {
  const finalOpts = {...dynamicPackOptsDefaultOpt, ...pluginOpts};

  if (process.env.TARO_ENV !== Taro.ENV_TYPE.WEAPP) return; // TODO 可能有大小写问题

  ctx.modifyWebpackChain(({chain}) => {

    // chain.optimization.merge({
    //   splitChunks: {
    //     cacheGroups: {
    //       common: {
    //         name: 'common',
    //         minChunks: 2,
    //         priority: 1,
    //         enforce: true,
    //       },
    //       vendors: {
    //         name: 'vendors',
    //         minChunks: 2,
    //         test: (module: any) => /[\\/]node_modules[\\/]/.test(module.resource),
    //         priority: 10,
    //         enforce: true,
    //       },
    //       [`${finalOpts.dynamicModuleJsDir}-js`]: {
    //         name: (module: any) => `${finalOpts.dynamicModuleJsDir}/${module.buildInfo.hash}`,
    //         chunks: 'async',
    //         test: /\.(js|jsx|ts|tsx)$/,
    //         enforce: true, // 强制拆分，即使 minSize 没达到
    //       },
    //       [`${finalOpts.dynamicModuleJsDir}-js-common`]: {
    //         name: `${finalOpts.dynamicModuleJsDir}/common`,
    //         chunks: 'async',
    //         minChunks: 2,
    //         priority: 2,
    //         test: /\.(js|jsx|ts|tsx)$/,
    //         enforce: true, // 强制拆分，即使 minSize 没达到
    //       },
    //       // TODO 待确认
    //       // [`${finalOpts.dynamicModuleJsDir}-assets`]: {
    //       //     name: `${finalOpts.dynamicModuleJsDir}/assets`,
    //       //     chunks: 'async',
    //       //     test: /\.(png|jpg|jpeg|svg)$/,
    //       //     enforce: true, // 强制拆分，即使 minSize 没达到
    //       // },
    //       [`${finalOpts.dynamicModuleStyleFile}-css`]: {
    //         name: finalOpts.dynamicModuleStyleFile,
    //         chunks: 'async',
    //         test: /\.(css|less|scss|sass)$/,
    //         enforce: true, // 强制拆分，即使 minSize 没达到
    //       },
    //     },
    //   },
    // });

    chain.merge({
      output: {
        chunkFilename: `${finalOpts.dynamicModuleJsDir}/[contenthash].js`, // 异步模块输出路径
        path: path.resolve(__dirname, 'dist'),
        clean: true,
      },
    })

    chain.plugin('miniCssExtractPlugin')
      .tap((args: [MiniCssExtractPlugin.PluginOptions]) => {
        const [options] = args;
        const finalOption = {...options, chunkFilename: finalOpts.dynamicModuleStyleFile}
        return [finalOption];
      });

    chain.plugin(PLUGIN_NAME).use(TransformBeforeCompressionPlugin, [{
      test: /^(runtime\.js|app\.wxss)$/,
      transform: (opt: TransformOpt) => {
        const {source, assetName, assets} = opt
        const transformOpts = {...finalOpts, assets}
        if (/^app\.wxss$/.test(assetName)) return transformAppStylesheet(source as string, transformOpts);
        if (/^runtime\.js$/.test(assetName)) return transformWebpackRuntime(source as string, transformOpts);
        return source
      },
    }]);
  });

  ctx.modifyBuildAssets(({assets}) => {
    const curAppJSON = assets['app.json'];

    if (!curAppJSON) return;

    const curAppJSONContent = JSON.parse(curAppJSON.source());

    const dynamicPackagesConfig = {root: finalOpts.dynamicModuleJsDir, pages: []};

    const {resolveAlias = {}, subpackages = []} = curAppJSONContent;

    const newAppJSONContent = {
      ...curAppJSONContent,
      subpackages: [...subpackages, dynamicPackagesConfig], // TODO 判断是否存在异步模块
      resolveAlias: {
        ...resolveAlias,
        [`${finalOpts.dynamicModuleJsDir}/*`]: `/${finalOpts.dynamicModuleJsDir}/*`,
      },
    };

    assets['app.json'] = new RawSource(JSON.stringify(newAppJSONContent, null, 2));
  });
};
