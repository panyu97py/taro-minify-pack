import path from 'path'
import { RemoteAssetPluginOpt } from '@/types'
import { IPluginContext } from '@tarojs/service'
import { uploadAssets } from './upload-assets'
import { getCacheData, saveCacheData } from './utils'
import { pathTransform } from '@/path-transform/path-transform'

export * from '@/types'

export * from './upload-adapter'

const cacheFilePath = path.resolve(process.cwd(), 'node_modules', '.cache/remote-assets-cache.json')

export default (ctx: IPluginContext, pluginOpts: RemoteAssetPluginOpt) => {
  const transform = pathTransform({ cacheFilePath, pathAlias: pluginOpts.pathAlias || {} })

  ctx.onBuildStart(async () => {
    const { assetsDirPath, uploader } = pluginOpts
    const cacheData = getCacheData(cacheFilePath)
    const remoteAssetInfoList = await uploadAssets({ assetsDirPath, cacheData, upload: uploader })
    const remoteAssetInfoMap = remoteAssetInfoList.reduce((result, item) => {
      return { ...result, [item.localPath]: item.remoteUrl }
    }, cacheData)
    saveCacheData(cacheFilePath, remoteAssetInfoMap)
  })

  ctx.modifyRunnerOpts((curRunnerOpts) => {
    const { postcss: curPostcssOpts } = curRunnerOpts.opts
    const postCssPluginPathTransformPath = path.resolve(__dirname, './path-transform/path-transform-postcss')
    curRunnerOpts.opts.postcss = {
      ...curPostcssOpts,
      [postCssPluginPathTransformPath]: { enabled: true, config: { transform } }
    }
  })

  ctx.modifyWebpackChain(({ chain }) => {
    const babelPluginPathTransformPath = path.resolve(__dirname, './path-transform/path-transform-babel')

    chain.module
      .rule('script')
      .use('babelLoader')
      .options({ plugins: [[babelPluginPathTransformPath, { transform }]] })
  })
}
