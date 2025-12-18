export interface LocalAssetInfo {
    localPath: string,
    uniqueKey: string
}

export interface RemoteAssetInfo {
    localPath: string,
    uniqueKey: string,
    remotePath: string
}

export type Uploader = (opt: LocalAssetInfo) => Promise<RemoteAssetInfo>

export type UploaderAdapter<T = any> = (opt: T) => Uploader

export interface RemoteAssetPluginOpt {
    assetsDirPath: string,
    pathAlias?: Record<string, string>
    uploader?: Uploader,
}
