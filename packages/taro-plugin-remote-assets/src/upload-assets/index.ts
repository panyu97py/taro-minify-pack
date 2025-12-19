import { PromisePool } from '@supercharge/promise-pool'
import { Uploader } from '@/types'
import { generateFileUniqueKey, travelFiles } from '@/utils'
import path from 'path'

interface UploaderOpt {
    assetsDirPath?: string,
    upload?: Uploader
}

export const uploadAssets = async (opt: UploaderOpt) => {
  const { assetsDirPath, upload } = opt

  if (!assetsDirPath || !upload) return []

  const assetsPaths = travelFiles(assetsDirPath)

  const { results: remoteAssetInfoList } = await PromisePool.withConcurrency(2)
    .for(assetsPaths)
    .process(async (localPath) => {
      const uniqueKey = generateFileUniqueKey(localPath)
      const { ext } = path.parse(localPath)
      return upload({ localPath, uniqueKey, ext })
    })

  return remoteAssetInfoList
}
