export interface LocalAssetInfo {
    localPath: string,
    fileName: string,
    uniqueKey: string,
    ext: string
}

export interface RemoteAssetInfo {
    ext: string,
    localPath: string,
    uniqueKey: string,
    remoteUrl: string
}

export type Uploader = (localAssetInfo: LocalAssetInfo, payload?: any) => Promise<RemoteAssetInfo>

export type UploaderAdapter<T = any> = (opt: T) => Uploader
