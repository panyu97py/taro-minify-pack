import type { RemoteAssetPluginOpt } from '@taro-minify-pack/plugin-remote-assets'
import type { AsyncPackOpts } from '@taro-minify-pack/plugin-async-pack'
import type{ CoverBrowsersListOpt } from '@taro-minify-pack/plugin-cover-browserslist'
import type { BundleAnalyzerOpt } from '@taro-minify-pack/plugin-bundle-analyzer'

export * from '@taro-minify-pack/plugin-remote-assets'

interface Opt {
    asyncPack?: AsyncPackOpts | boolean
    bundleAnalyzer?:BundleAnalyzerOpt | boolean
    coverBrowsersList?: CoverBrowsersListOpt
    remoteAssets?: RemoteAssetPluginOpt
}

export default (_: any, opt: Opt) => {
  const { remoteAssets, asyncPack, coverBrowsersList, bundleAnalyzer } = opt
  const plugins = []

  // 远程静态资源插件
  if (remoteAssets) plugins.push([require.resolve('@taro-minify-pack/plugin-remote-assets'), remoteAssets])

  // 覆盖 BrowsersList 插件
  if (coverBrowsersList) plugins.push([require.resolve('@taro-minify-pack/plugin-cover-browserslist'), coverBrowsersList])

  // 异步分包插件
  if (Boolean(asyncPack) && typeof asyncPack === 'boolean') plugins.push(require.resolve('@taro-minify-pack/plugin-async-pack'))
  if (Boolean(asyncPack) && typeof asyncPack !== 'boolean') plugins.push([require.resolve('@taro-minify-pack/plugin-async-pack'), asyncPack])

  // 包体积分析插件
  if (Boolean(bundleAnalyzer) && typeof bundleAnalyzer === 'boolean') plugins.push(require.resolve('@taro-minify-pack/plugin-bundle-analyzer'))
  if (Boolean(bundleAnalyzer) && typeof bundleAnalyzer !== 'boolean') plugins.push([require.resolve('@taro-minify-pack/plugin-bundle-analyzer'), bundleAnalyzer])

  return { plugins }
}
