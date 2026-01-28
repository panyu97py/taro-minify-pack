# @taro-minify-pack/plugin-remote-assets

> 自动上传本地静态资源并替换为远程访问地址，减少小程序主包体积。

该插件会在构建阶段扫描代码与样式中的本地资源引用（如图片、字体等），
将其上传至指定的对象存储服务，并将原有本地路径自动替换为远程 URL，
从而避免静态资源被打入主包。

## ⚠️ 版本说明

### Taro < 4.0.10

由于 @tarojs/webpack5-runner 不支持使用绝对路径注册 PostCSS 插件，
在低版本 Taro 中直接使用本插件可能会导致插件无法生效。
如需在低版本中使用，请参考官方 Pull Request([#18683](https://github.com/NervJS/taro/pull/18683/files)) 自行 patch

### Taro ≥ 4.0.10

可直接使用，无需额外处理。

## ✨ 功能特性

* 🚀 构建阶段自动上传本地静态资源
* 🔁 自动替换 JS / CSS 中的资源引用路径
* 🧩 支持路径别名解析（@、~@ 等）
* ☁️ 支持自定义上传适配器
* 📦 有效降低小程序主包体积
* 📝 基于文件内容 MD5 的资源唯一性校验
* 📎 智能缓存机制，避免重复上传
* ⚡ 并发上传支持，提高构建效率

## 📦 安装

### npm

```sh
npm install @taro-minify-pack/plugin-remote-assets
```

### yarn

```sh
yarn add @taro-minify-pack/plugin-remote-assets
```

### pnpm

```sh
pnpm add @taro-minify-pack/plugin-remote-assets
```

## 🔧 使用配置

### 插件参数说明

| 参数名             | 是否必填 | 类型                       | 默认值  | 说明                     |
|-----------------|------|--------------------------|------|------------------------|
| `assetsDirPath` | 是    | `string`                 | -    | 本地静态资源根目录，用于限制可上传的资源范围 |
| `pathAlias`     | 否    | `Record<string, string>` | `{}` | 路径别名映射，用于解析代码中的资源引用    |
| `uploader`      | 是    | `UploadAdapter`          | -    | 资源上传适配器，需返回资源的远程访问 URL |

### 🔌 自定义上传适配器

插件内部仅约定 上传接口规范，并不限制具体存储服务。
你可以很方便地实现自己的上传适配器：

#### 接口定义

```ts
import { LocalAssetInfo, defineUploaderAdapter } from '@taro-minify-pack/plugin-remote-assets'

interface LocalAssetInfo {
  localPath: string;      // 本地资源文件路径
  uniqueKey: string;      // 基于文件内容生成的 MD5 值
  ext: string;            // 文件扩展名
}

export interface CustomUploadAdapterOpt {
  // 自定义适配器参数
}

export const customUploadAdapter = defineUploaderAdapter((opt: CustomUploadAdapterOpt) => {
  return async (localAssetInfo: LocalAssetInfo): Promise<LocalAssetInfo & { remoteUrl: string }> => {
    // 实现上传逻辑
    // 返回包含远程 URL 的资源信息
    return { ...localAssetInfo, remoteUrl: 'https://example.com/remote-asset.png' }
  }
})
```

#### 内置阿里云 OSS 适配器

插件内置了阿里云 OSS 上传适配器，可直接使用：

```ts
import { aliOssUploadAdapter } from '@taro-minify-pack/plugin-remote-assets'

interface AliOssUploadAdapterOpt {
  customDomain?: string;      // 自定义域名（可选）
  bucketDir?: string;         // OSS 存储目录（可选，默认根目录）
  // 以下为阿里云 OSS 标准配置
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  // ... 其他阿里云 OSS 配置
}
```

### 示例配置

```js
// config/index.js
const path = require('path')
const { aliOssUploadAdapter } = require('@taro-minify-pack/plugin-remote-assets')

module.exports = {
    plugins: [
        ['@taro-minify-pack/plugin-remote-assets', {
            // 路径别名（用于解析代码中的资源引用）
            pathAlias: {
                '@': path.resolve(__dirname, '../src/'),
                '~@': path.resolve(__dirname, '../src/'),
            },
            // 本地静态资源根目录
            assetsDirPath: path.resolve(__dirname, '../src/assets/'),
            // 上传适配器（以阿里云 OSS 为例）
            uploader: aliOssUploadAdapter({
                customDomain: 'https://your-custom-domain.com',
                accessKeyId: 'your-access-key-id',
                accessKeySecret: 'your-access-key-secret',
                bucket: 'your-bucket-name',
                bucketDir: 'taro-assets',
                region: 'your-region',
            }),
        }],
    ],
}
```

## 🧠 工作原理简述

1. **构建开始**：插件在构建开始时扫描指定的静态资源目录
2. **资源分析**：
   - 递归遍历目录下所有文件
   - 基于文件内容生成 MD5 值作为唯一标识
   - 检查缓存文件，跳过已上传的资源
3. **并发上传**：使用 PromisePool 并发上传新资源（默认并发数：2）
4. **生成缓存**：将上传结果写入缓存文件（node_modules/.cache/remote-assets-cache.json）
5. **路径转换**：
   - Babel 插件：替换 JS/TS 文件中的 import 语句
   - PostCSS 插件：替换 CSS 文件中的 url() 引用
6. **构建完成**：最终产物中静态资源路径已替换为远程 URL

### 缓存机制

插件使用本地缓存文件记录已上传的资源信息，避免重复上传：
- 缓存文件路径：`node_modules/.cache/remote-assets-cache.json`
- 缓存键：本地资源文件路径
- 缓存值：远程资源访问 URL
- 每次构建前会检查缓存，仅上传新的或修改过的资源

### 资源唯一性校验

为确保资源唯一性，插件使用文件内容的 MD5 值作为唯一标识：
- 即使文件名相同，只要内容不同，也会被视为不同资源
- 生成的 MD5 值会作为文件名的一部分上传到存储服务
- 确保同一资源不会被重复存储

## 📌 适用场景

* 主包体积接近或超过微信限制（2MB）
* 图片、字体等静态资源较多
* 已使用远程 CDN / 对象存储服务
* 需要优化小程序加载速度

如你正在配合 @taro-minify-pack 系列插件使用，可获得更完整的主包体积优化方案。

## 🔍 代码示例

### JS/TS 文件中的资源引用

```tsx
// 原始代码
import logo from '@/assets/images/logo.png'

// 构建后自动转换为
const logo = 'https://your-cdn.com/taro-assets/2f9b7a8c9d0e1f2a3b4c5d6e7f8a9b0c.png'
```

### CSS 文件中的资源引用

```css
/* 原始代码 */
.logo {
  background-image: url('@/assets/images/logo.png');
}

/* 构建后自动转换为 */
.logo {
  background-image: url('https://your-cdn.com/taro-assets/2f9b7a8c9d0e1f2a3b4c5d6e7f8a9b0c.png');
}
```

## 🤔 常见问题

### 1. 为什么有些资源没有被上传？

- 请检查资源是否在指定的 `assetsDirPath` 目录下
- 检查资源引用路径是否正确
- 确保路径别名配置正确

### 2. 为什么修改了资源后没有重新上传？

- 插件基于文件内容的 MD5 值判断资源是否修改
- 如果仅修改了文件名而内容未变，不会重新上传
- 如需强制重新上传，可删除缓存文件后重新构建

### 3. 如何处理动态引入的资源？

- 插件目前仅支持静态 import 和 url() 引用
- 动态引入的资源（如使用变量拼接路径）需要手动处理

### 4. 上传失败怎么办？

- 检查上传适配器配置是否正确
- 确保网络连接正常
- 查看构建日志获取详细错误信息

### 5. 如何自定义缓存文件路径？

- 当前版本不支持自定义缓存文件路径
- 缓存文件固定在 `node_modules/.cache/remote-assets-cache.json`

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
