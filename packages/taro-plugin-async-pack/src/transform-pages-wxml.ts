import { AppConfig } from '@tarojs/taro'
import { RawSource } from 'webpack-sources'

interface Opts {
  assets: Record<string, RawSource>;
  asyncComponents: Record<string, string>;
}

const appConfigAssetKey = 'app.json'

export const transformPagesWXml = (opts: Opts) => {
  const { assets, asyncComponents } = opts

  const curAppConfig: AppConfig = JSON.parse(assets[appConfigAssetKey].source() as string)

  const pagesPath = (() => {
    const { pages = [], subpackages, subPackages, tabBar } = curAppConfig
    const tabBarPagePaths = tabBar?.list?.map((item) => item.pagePath) || []
    const curSubPackages = subPackages || subpackages || []
    const subPackagePagePaths = curSubPackages.reduce<string[]>((result, item) => {
      const subPackagePagePath = item.root || ''
      return [...result, ...(item.pages || []).map((page) => `${subPackagePagePath}/${page}`)]
    }, [])
    return [...pages, ...tabBarPagePaths, ...subPackagePagePaths].map((item) => `${item}.wxml`)
  })()

  const asyncComponentCode = Object.keys(asyncComponents).map((item) => `<${item}/>`)

  Object.keys(assets).forEach((assetPath) => {
    if (!pagesPath.includes(assetPath)) return
    const source = assets[assetPath].source() as string
    const tempCode = [source, ...asyncComponentCode].join('\n')
    assets[assetPath] = new RawSource(tempCode)
  })
}
