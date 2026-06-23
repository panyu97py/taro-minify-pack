import { PromisePool } from '@supercharge/promise-pool'
import { LocalAssetInfo, Uploader } from './types'
import { generateFileUniqueKey, travelFiles } from './utils'
import path from 'path'

interface UploaderOpt {
    assetsDirPath?: string,
    upload?: Uploader
}
export * from './adapter'
export * from './types'

export const uploadAssets = async (opt: UploaderOpt) => {
  const { assetsDirPath, upload } = opt

  if (!assetsDirPath || !upload) return []

  const assetsPaths = travelFiles(assetsDirPath)

  const assetsInfos = assetsPaths.reduce<LocalAssetInfo[]>((result, localPath) => {
    const uniqueKey = generateFileUniqueKey(localPath)
    const { ext } = path.parse(localPath)
    const fileName = path.parse(localPath).name
    return [...result, { localPath, ext, uniqueKey, fileName }]
  }, [])

  const { results: remoteAssetInfoList } = await PromisePool.withConcurrency(2)
    .for(assetsInfos)
    .process(async (localAssetInfo) => upload(localAssetInfo))

  return remoteAssetInfoList.filter(Boolean)
}
