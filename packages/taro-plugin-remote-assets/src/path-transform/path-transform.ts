import { getCacheData } from '@/utils'

interface Opt{
  cacheFilePath: string
  pathAlias: Record<string, string>
}

export const pathTransform = (opt: Opt) => {
  return (path: string) => {
    const remoteAssetInfoMap = getCacheData(opt.cacheFilePath) || {}

    const pathAliasRegMap = Object.keys(opt.pathAlias).reduce<Record<string, RegExp>>((result, key) => {
      return { ...result, [key]: new RegExp(`^${key}`) }
    }, {})

    const localPath = (() => {
      const matchPathAlias = Object.keys(pathAliasRegMap).find(key => pathAliasRegMap[key].test(path))
      if (matchPathAlias) return path.replace(pathAliasRegMap[matchPathAlias], opt.pathAlias[matchPathAlias])
      return path
    })()
    if (!remoteAssetInfoMap[localPath]) return localPath
    return remoteAssetInfoMap[localPath]
  }
}
