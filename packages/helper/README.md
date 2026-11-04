# @taro-minify-pack/helper

> @taro-minify-pack 系列插件的公共工具库，提供资源上传、上传适配器定义等通用能力。

该包为系列插件提供底层支持，主要包含资源上传核心逻辑、上传适配器定义工具以及内置的阿里云 OSS 上传适配器，供 `@taro-minify-pack/plugin-remote-assets`、`@taro-minify-pack/plugin-bundle-stats` 等插件复用。

## ✨ 功能特性

* 📤 资源并发上传，基于 PromisePool 控制并发数
* 🧩 上传适配器定义工具（`defineUploaderAdapter`），支持类型安全地自定义适配器
* ☁️ 内置阿里云 OSS 上传适配器，开箱即用
* 🔑 基于文件内容 MD5 的资源唯一性校验

## 📦 安装

### npm

```sh
npm install @taro-minify-pack/helper
```

### yarn

```sh
yarn add @taro-minify-pack/helper
```

### pnpm

```sh
pnpm add @taro-minify-pack/helper
```

## 🔧 API

### `uploadAssets(opt)`

扫描指定目录下的所有文件，并发上传至远程存储服务。

```ts
import { uploadAssets } from '@taro-minify-pack/helper'

const results = await uploadAssets({
  assetsDirPath: '/path/to/assets',
  upload: async (localAssetInfo) => {
    // 实现上传逻辑，返回包含 remoteUrl 的资源信息
    return { ...localAssetInfo, remoteUrl: 'https://example.com/asset.png' }
  },
  payload: {},                    // 可选，透传给 upload 函数的额外参数
  processAssets: (assets) => assets, // 可选，上传前对资源列表进行过滤或排序
})
```

#### 参数说明

| 参数名             | 是否必填 | 类型                           | 默认值                  | 说明                     |
|-----------------|------|------------------------------|----------------------|------------------------|
| `assetsDirPath` | 否    | `string`                     | -                    | 本地静态资源根目录；缺省时返回空数组 |
| `upload`        | 否    | `Uploader`                   | -                    | 上传函数；缺省时返回空数组 |
| `payload`       | 否    | `any`                        | -                    | 透传给 upload 函数的额外参数     |
| `processAssets` | 否    | `(assets) => assets`         | `(assets) => assets` | 上传前对资源列表进行过滤或排序       |

### `defineUploaderAdapter(adapter)`

定义上传适配器的工具函数，提供类型推导支持。

```ts
import { defineUploaderAdapter } from '@taro-minify-pack/helper'

interface MyAdapterOpt {
  endpoint: string
  apiKey: string
}

const myUploadAdapter = defineUploaderAdapter((opt: MyAdapterOpt) => {
  return async (localAssetInfo, payload) => {
    // 实现上传逻辑
    const remoteUrl = await uploadToMyService(opt, localAssetInfo)
    return { ...localAssetInfo, remoteUrl }
  }
})
```

### `aliOssUploadAdapter(opt)`

内置的阿里云 OSS 上传适配器，支持自定义域名、文件名生成、目录前缀等配置。

```ts
import { aliOssUploadAdapter } from '@taro-minify-pack/helper'

const uploader = aliOssUploadAdapter({
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  bucket: 'your-bucket-name',
  region: 'oss-cn-hangzhou',
  bucketDir: 'taro-assets',            // 可选，OSS 存储目录前缀，默认为根目录
  customDomain: 'https://cdn.example.com/taro-assets', // 可选，需包含 bucketDir 对应的路径
  fileName: (info) => info.uniqueKey,   // 可选，远程文件名生成函数，默认使用 uniqueKey
})
```

#### AliOssUploadAdapterOpt 参数说明

| 参数名              | 是否必填 | 类型                                   | 默认值                     | 说明                       |
|------------------|------|--------------------------------------|-------------------------|--------------------------|
| `accessKeyId`    | 是    | `string`                             | -                       | 阿里云 AccessKey ID         |
| `accessKeySecret`| 是    | `string`                             | -                       | 阿里云 AccessKey Secret     |
| `bucket`         | 是    | `string`                             | -                       | OSS Bucket 名称            |
| `region`         | 是    | `string`                             | -                       | OSS 区域                   |
| `bucketDir`      | 否    | `string`                             | `''`                    | OSS 存储目录前缀               |
| `customDomain`   | 否    | `string`                             | -                       | URL 前缀；当前实现不会自动拼接 `bucketDir`，需自行包含对应路径 |
| `fileName`       | 否    | `(info) => string`                   | `(info) => info.uniqueKey` | 远程文件名生成函数               |

### 内部工具函数

以下函数仅供包内部使用，未从包入口导出，不能通过 `@taro-minify-pack/helper` 导入。

#### `travelFiles(dir)`

递归遍历目录，返回所有文件路径；传入绝对目录时返回绝对路径。

```ts
const files = travelFiles('/path/to/directory')
// => ['/path/to/directory/a.png', '/path/to/directory/sub/b.png']
```

#### `generateFileUniqueKey(filePath)`

基于文件内容生成 MD5 唯一标识。

```ts
const key = generateFileUniqueKey('/path/to/file.png')
// => '2f9b7a8c9d0e1f2a3b4c5d6e7f8a9b0c'
```

### 类型定义

```ts
interface LocalAssetInfo {
  localPath: string    // 本地资源文件路径
  fileName: string     // 文件名（不含扩展名）
  uniqueKey: string    // 基于文件内容生成的 MD5 值
  ext: string          // 文件扩展名（含 .）
}

interface RemoteAssetInfo {
  ext: string          // 文件扩展名
  localPath: string    // 本地资源文件路径
  uniqueKey: string    // 基于文件内容生成的 MD5 值
  remoteUrl: string    // 远程资源访问 URL
}

type Uploader = (localAssetInfo: LocalAssetInfo, payload?: any) => Promise<RemoteAssetInfo>

type UploaderAdapter<T = any> = (opt: T) => Uploader
```

## 🧠 工作原理

1. **文件扫描**：`travelFiles` 递归遍历指定目录，收集所有文件路径
2. **内容标识**：`generateFileUniqueKey` 读取文件内容并生成 MD5 值；`uploadAssets` 本身不做去重，需由 `processAssets` 或上传适配器处理
3. **并发上传**：`uploadAssets` 使用 `@supercharge/promise-pool` 控制并发数（默认为 2），批量上传资源
4. **适配器模式**：通过 `defineUploaderAdapter` 定义上传适配器，将上传逻辑与存储服务解耦，支持灵活扩展

### 阿里云 OSS 适配器工作流程

1. 初始化 OSS 客户端
2. 对每个资源文件，先通过 `head` 接口检查远程是否已存在同名文件
3. 若已存在，直接返回远程 URL，跳过上传
4. 若不存在，调用 `put` 接口上传文件，并返回远程 URL
5. 如果配置了 `customDomain`，远程 URL 使用自定义域名；否则使用 OSS 签名 URL

## 📌 适用场景

* 为 `@taro-minify-pack` 系列插件提供上传能力
* 需要在 Taro 项目中将静态资源上传至对象存储
* 需要自定义上传适配器对接不同的存储服务
* 需要基于文件内容 MD5 进行资源去重

## ⚠️ 注意事项

1. **内部依赖**：该包主要为 `@taro-minify-pack` 系列插件提供公共能力，一般不单独使用
2. **并发控制**：`uploadAssets` 默认并发数为 2，避免对存储服务造成过大压力
3. **文件唯一性**：基于文件内容 MD5 生成唯一标识；是否跳过上传取决于调用方的过滤逻辑和适配器实现
4. **OSS 适配器**：使用 `aliOssUploadAdapter` 需要确保阿里云 OSS 配置正确，且有足够的访问权限

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

> 该包是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
