import { Uploader } from '@taro-minify-pack/helper'

export interface RemoteAssetPluginOpt {
    assetsDirPath: string,
    pathAlias?: Record<string, string>
    uploader?: Uploader,
}
