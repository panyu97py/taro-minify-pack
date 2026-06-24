import path from 'path'
import { RemoteAssetPluginOpt } from '@/types'
import { IPluginContext } from '@tarojs/service'
import { LocalAssetInfo, uploadAssets } from '@taro-minify-pack/helper'
import { getCacheData, saveCacheData } from './utils'
import { pathTransform } from '@/path-transform/path-transform'

export * from '@/types'

const cacheFilePath = path.resolve(process.cwd(), 'node_modules', '.cache/remote-assets.json')

export default (ctx: IPluginContext, pluginOpts: RemoteAssetPluginOpt) => {
  const transform = pathTransform({ cacheFilePath, pathAlias: pluginOpts.pathAlias || {} })

  ctx.onBuildStart(async () => {
    const { assetsDirPath, uploader } = pluginOpts
    const cacheData = getCacheData(cacheFilePath)
    const cacheAssetUniqueKeys = Object.values(cacheData).map(item => item.uniqueKey)
    const processAssets = (assets: LocalAssetInfo[]) => assets.filter(item => !cacheAssetUniqueKeys.includes(item.uniqueKey))
    const remoteAssetInfoList = await uploadAssets({ assetsDirPath, upload: uploader, processAssets })
    const remoteAssetInfoMap = remoteAssetInfoList.reduce((result, item) => {
      return { ...result, [item.localPath]: item }
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
