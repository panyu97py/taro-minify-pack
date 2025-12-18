import { defineUploaderAdapter } from './define-adapter'
import { LocalAssetInfo } from '@/types'

interface aliOssUploadAdapterOpt {
    accessKeyId: string,
    accessKeySecret: string,
    bucketName: string,
    region: string,
}

export const aliOssUploadAdapter = defineUploaderAdapter((opt: aliOssUploadAdapterOpt) => {
  return async (localAssetInfo: LocalAssetInfo) => {
    // TODO: 实现上传到 ali oss 的逻辑
    return { ...localAssetInfo, remotePath: 'https://localAssetInfo.localPath.png' }
  }
})
