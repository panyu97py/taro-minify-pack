export interface LocalAssetInfo {
    localPath: string,
    uniqueKey: string,
    ext: string
}

export interface RemoteAssetInfo {
    ext: string,
    localPath: string,
    uniqueKey: string,
    remoteUrl: string
}

export type Uploader = (opt: LocalAssetInfo) => Promise<RemoteAssetInfo>

export type UploaderAdapter<T = any> = (opt: T) => Uploader

export interface RemoteAssetPluginOpt {
    assetsDirPath: string,
    pathAlias?: Record<string, string>
    uploader?: Uploader,
}
