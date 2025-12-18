import { RemoteAssetPluginOpt } from '@taro-minify-pack/plugin-remote-assets'
import { AsyncPackOpts } from '@taro-minify-pack/plugin-async-pack'

export * from '@taro-minify-pack/plugin-remote-assets'

interface Opt {
    remoteAssets?: RemoteAssetPluginOpt
    asyncPack?: AsyncPackOpts | boolean
}

export default (_: any, opt: Opt) => {
  const { remoteAssets, asyncPack } = opt
  const plugins = []
  if (remoteAssets) plugins.push([require.resolve('@taro-minify-pack/plugin-remote-assets'), remoteAssets])
  if (asyncPack && typeof asyncPack === 'boolean') plugins.push(require.resolve('@taro-minify-pack/plugin-async-pack'))
  if (asyncPack && typeof asyncPack !== 'boolean') plugins.push([require.resolve('@taro-minify-pack/plugin-async-pack'), asyncPack])
  return { plugins }
}
