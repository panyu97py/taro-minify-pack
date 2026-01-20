import { RemoteAssetPluginOpt } from '@taro-minify-pack/plugin-remote-assets'
import { AsyncPackOpts } from '@taro-minify-pack/plugin-async-pack'
import { CoverBrowsersListOpt } from '@taro-minify-pack/plugin-cover-browserslist'

export * from '@taro-minify-pack/plugin-remote-assets'

interface Opt {
    remoteAssets?: RemoteAssetPluginOpt
    asyncPack?: AsyncPackOpts | boolean
    coverBrowsersList: CoverBrowsersListOpt
}

export default (_: any, opt: Opt) => {
  const { remoteAssets, asyncPack, coverBrowsersList } = opt
  const plugins = []
  if (remoteAssets) plugins.push([require.resolve('@taro-minify-pack/plugin-remote-assets'), remoteAssets])
  if (coverBrowsersList) plugins.push([require.resolve('@taro-minify-pack/plugin-cover-browserslist'), coverBrowsersList])
  if (asyncPack && typeof asyncPack === 'boolean') plugins.push(require.resolve('@taro-minify-pack/plugin-async-pack'))
  if (asyncPack && typeof asyncPack !== 'boolean') plugins.push([require.resolve('@taro-minify-pack/plugin-async-pack'), asyncPack])
  return { plugins }
}
