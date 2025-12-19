import { defineUploaderAdapter } from './define-adapter'
import { LocalAssetInfo } from '@/types'
import AliOss from 'ali-oss'
import path from 'path'

export interface AliOssUploadAdapterOpt extends AliOss.Options {
  customDomain?: string
  bucketDir?: string
}

export const aliOssUploadAdapter = defineUploaderAdapter((opt: AliOssUploadAdapterOpt) => {
  const { customDomain, bucketDir = '/', ...aliOssOpt } = opt

  const client = new AliOss(aliOssOpt)

  const isRemoteAssetExist = async (...args: Parameters<AliOss['head']>) => {
    try {
      await client.head(...args)
      return true
    } catch (error: any) {
      if (error.code === 'NoSuchKey') return false
      throw error
    }
  }

  const uploadToAliOss = async (...args: Parameters<AliOss['put']>) => client.put(...args)

  const getRemoteAssetPath = (localAssetInfo: LocalAssetInfo) => {
    const { uniqueKey, ext } = localAssetInfo
    return path.join(bucketDir, `${uniqueKey}${ext}`)
  }

  const getRemoteAssetUrl = (localAssetInfo: LocalAssetInfo) => {
    const { uniqueKey, ext } = localAssetInfo
    if (customDomain) return path.join(customDomain, `${uniqueKey}${ext}`)
    const remotePath = getRemoteAssetPath(localAssetInfo)
    return client.signatureUrl(remotePath)
  }

  return async (localAssetInfo: LocalAssetInfo) => {
    const { localPath } = localAssetInfo
    const remoteAssetPath = getRemoteAssetPath(localAssetInfo)
    const remoteAssetUrl = getRemoteAssetUrl(localAssetInfo)
    const isExist = await isRemoteAssetExist(remoteAssetPath)
    if (isExist) return { ...localAssetInfo, remoteUrl: remoteAssetUrl }
    await uploadToAliOss(remoteAssetPath, localPath)
    return { ...localAssetInfo, remoteUrl: remoteAssetUrl }
  }
})
