import path from 'path'
import { RemoteAssetPluginOpt } from '@/types'
import { IPluginContext } from '@tarojs/service'
import { uploadAssets } from './upload-assets'
import { saveCacheData } from './utils'
import { pathTransform } from '@/path-transform/path-transform'

export { RemoteAssetPluginOpt } from '@/types'

export * from './upload-adapter'

const cacheFilePath = path.resolve(__dirname, 'remote-assets-cache.json')

export default (ctx: IPluginContext, pluginOpts: RemoteAssetPluginOpt) => {
  const transform = pathTransform({ cacheFilePath, pathAlias: pluginOpts.pathAlias || {} })

  ctx.onBuildStart(async () => {
    const { assetsDirPath, uploader } = pluginOpts
    const remoteAssetInfoList = await uploadAssets({ assetsDirPath, upload: uploader })
    const remoteAssetInfoMap = remoteAssetInfoList.reduce((result, item) => {
      return { ...result, [item.localPath]: item.remotePath }
    }, {})
    saveCacheData(cacheFilePath, remoteAssetInfoMap)
  })

  ctx.modifyRunnerOpts((curRunnerOpts) => {
    const { postcss: curPostcssOpts } = curRunnerOpts.opts
    console.log(curPostcssOpts, path.resolve(__dirname, './path-transform/path-transform-postcss'))
    curRunnerOpts.opts.postcss = {
      ...curPostcssOpts,
      [path.resolve(__dirname, './path-transform/path-transform-postcss')]: {
        enabled: true,
        config: { transform }
      }
    }
  })

  ctx.modifyWebpackChain(({ chain }) => {
    const babelPluginPathTransformPath = path.resolve(__dirname, './path-transform/path-transform-babel')

    chain.module
      .rule('script')
      .use('babelLoader')
      .options({
        plugins: [
          [babelPluginPathTransformPath, { transform }]
        ]
      })
  })
}
