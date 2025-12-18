import { PromisePool } from '@supercharge/promise-pool'
import { Uploader, UploaderAdapter } from '@/types'
import { generateFileUniqueKey, travelFiles } from '@/utils'

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
      return upload({ localPath, uniqueKey })
    })

  return remoteAssetInfoList
}
