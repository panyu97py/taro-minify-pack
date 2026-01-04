import { PromisePool } from '@supercharge/promise-pool'
import { LocalAssetInfo, Uploader } from '@/types'
import { generateFileUniqueKey, travelFiles } from '@/utils'
import path from 'path'

interface UploaderOpt {
    assetsDirPath?: string,
    cacheData?:Record<string, any>
    upload?: Uploader
}

export const uploadAssets = async (opt: UploaderOpt) => {
  const { assetsDirPath, cacheData, upload } = opt

  if (!assetsDirPath || !upload) return []

  const uploadedAssetFileNames = Object.values(cacheData || {}).map(item => path.basename(new URL(item).pathname))

  const assetsPaths = travelFiles(assetsDirPath)

  const assetsInfos = assetsPaths.reduce<LocalAssetInfo[]>((result, localPath) => {
    const uniqueKey = generateFileUniqueKey(localPath)
    const { ext } = path.parse(localPath)
    const isUploaded = uploadedAssetFileNames.includes(`${uniqueKey}${ext}`)
    if (isUploaded) return result
    return [...result, { localPath, ext, uniqueKey }]
  }, [])

  const { results: remoteAssetInfoList } = await PromisePool.withConcurrency(2)
    .for(assetsInfos)
    .process(async (localAssetInfo) => upload(localAssetInfo))

  return remoteAssetInfoList.filter(Boolean)
}
