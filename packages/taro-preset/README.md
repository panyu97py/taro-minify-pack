## @taro-minify-pack/preset

> 预设配置，整合了 @taro-minify-pack 系列核心插件，提供一键式优化解决方案，简化 Taro 项目的性能优化配置。

该预设包含以下插件：
- `@taro-minify-pack/plugin-async-pack`: 异步加载主包代码，优化主包体积
- `@taro-minify-pack/plugin-remote-assets`: 远程资源上传，优化主包体积
- `@taro-minify-pack/plugin-cover-browserslist`: 根据微信小程序基础库版本自动设置 browserslist
- `@taro-minify-pack/plugin-bundle-analyzer`: 包体积分析工具

## ✨ 功能特性

| 插件名称                                        | 功能描述                                          |
|---------------------------------------------|-----------------------------------------------|
| @taro-minify-pack/plugin-async-pack         | 实现主包代码的异步加载，显著减小主包体积，提升小程序启动性能                |
| @taro-minify-pack/plugin-remote-assets      | 将静态资源上传到远程 CDN，减少主包大小，加快资源加载速度                |
| @taro-minify-pack/plugin-cover-browserslist | 根据微信小程序基础库版本自动设置 browserslist，减少不必要的 polyfill |
| @taro-minify-pack/plugin-bundle-analyzer    | 可视化分析包体积，帮助识别体积过大的模块和依赖                       |

## 📦 安装

```bash
# 使用 npm
npm install @taro-minify-pack/preset

# 使用 yarn
yarn add @taro-minify-pack/preset

# 使用 pnpm
pnpm add @taro-minify-pack/preset
```

## 🛠️ 配置

### Babel 配置

```ts
// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
    presets: [
        ['taro', {
            framework: 'react',
            ts: true,
            compiler: 'webpack5',
            // 在原有基础上添加这个配置即可
            'dynamic-import-node': process.env.TARO_ENV !== 'weapp', 
        }]
    ]
}
```

### Taro 配置

#### 基础配置示例

```js
// config/index.js
const path = require('path')
const { aliOssUploadAdapter } = require('@taro-minify-pack/preset')

module.exports = {
    compiler: {
        type: 'webpack5',
        prebundle: {
            // 关闭预打包，与分包异步编译有冲突
            enable: false, 
        }
    },
    presets: [
        ['@taro-minify-pack/preset', {
            // 开启远程资源上传，优化主包体积
            remoteAssets: {
                pathAlias: {
                    '@': path.resolve(__dirname, '../src/'),
                    '~@': path.resolve(__dirname, '../src/'),
                },
                assetsDirPath: path.resolve(__dirname, '../src/assets/'),
                uploader: aliOssUploadAdapter({
                    customDomain: 'https://your-custom-domain.com',
                    accessKeyId: 'your-access-key-id',
                    accessKeySecret: 'your-access-key-secret',
                    bucket: 'your-bucket-name',
                    bucketDir: 'bucketDir',
                    region: 'your-region',
                })
            },
            // 自动设置 browserslist 配置
            coverBrowsersList: {
                // 必填：微信小程序基础库最低版本号
                minBaseLibraryVersion: '2.14.4'
            },
            // 包体积分析配置
            bundleAnalyzer: true,
            // 开启异步加载主包代码，优化主包体积
            asyncPack: true
        }],
    ],
};
```

#### 完整配置示例

```js
// config/index.js
const path = require('path')
const { aliOssUploadAdapter } = require('@taro-minify-pack/remote-assets-adapter-ali-oss')

module.exports = {
    compiler: {
        type: 'webpack5',
        prebundle: {
            // 关闭预打包，与分包异步编译有冲突
            enable: false, 
        }
    },
    presets: [
        ['@taro-minify-pack/preset', {
            // 远程资源上传配置
            remoteAssets: {
                pathAlias: {
                    '@': path.resolve(__dirname, '../src/'),
                    '~@': path.resolve(__dirname, '../src/'),
                },
                assetsDirPath: path.resolve(__dirname, '../src/assets/'),
                uploader: aliOssUploadAdapter({
                    customDomain: 'https://your-custom-domain.com',
                    accessKeyId: 'your-access-key-id',
                    accessKeySecret: 'your-access-key-secret',
                    bucket: 'your-bucket-name',
                    bucketDir: 'bucketDir',
                    region: 'your-region',
                })
            },
            // 异步加载主包代码配置
            asyncPack: {
                // 框架类型，可选 'react' 或 'vue'
                framework: 'react',
                // 动态包名称前缀
                dynamicPackageNamePrefix: 'dynamic-common',
                // 动态包数量
                dynamicPackageCount: 1
            },
            // 自动设置 browserslist 配置
            coverBrowsersList: {
                // 必填：微信小程序基础库最低版本号
                minBaseLibraryVersion: '2.14.4'
            },
            // 包体积分析配置
            bundleAnalyzer: {
                // 服务器主机
                analyzerHost: '127.0.0.1',
                // 服务器端口
                analyzerPort: 8888,
                // 是否自动打开报告
                openAnalyzer: true
            }
        }],
    ],
};
```

## 📋 配置选项

### 通用配置

| 选项名               | 类型                               | 默认值     | 描述                          |
|-------------------|----------------------------------|---------|-----------------------------|
| asyncPack         | `boolean` \| `AsyncPackOpts`     | `false` | 异步加载主包代码配置，设为 `true` 使用默认配置 |
| remoteAssets      | `RemoteAssetPluginOpt`           | -       | 远程资源上传配置                    |
| coverBrowsersList | `CoverBrowsersListOpt`           | -       | 自动设置 browserslist 配置        |
| bundleAnalyzer    | `boolean` \| `BundleAnalyzerOpt` | `false` | 包体积分析配置，设为 `true` 使用默认配置    |

### asyncPack 配置

| 选项名                      | 类型       | 默认值                | 描述      |
|--------------------------|----------|--------------------|---------|
| dynamicPackageNamePrefix | `string` | `'dynamic-common'` | 动态包名称前缀 |
| dynamicPackageCount      | `number` | `1`                | 动态包数量   |

### remoteAssets 配置

| 选项名           | 类型                       | 默认值 | 描述           |
|---------------|--------------------------|-----|--------------|
| assetsDirPath | `string`                 | -   | 静态资源目录路径（必填） |
| pathAlias     | `Record<string, string>` | -   | 路径别名配置       |
| uploader      | `Function`               | -   | 资源上传适配器函数    |

### coverBrowsersList 配置

| 选项名                   | 类型       | 默认值 | 描述                |
|-----------------------|----------|-----|-------------------|
| minBaseLibraryVersion | `string` | -   | 微信小程序基础库最低版本号（必填） |

### bundleAnalyzer 配置

| 选项名          | 类型                   | 默认值           | 描述       |
|--------------|----------------------|---------------|----------|
| analyzerHost | `string`             | `'127.0.0.1'` | 服务器主机    |
| analyzerPort | `number` \| `'auto'` | `8888`        | 服务器端口    |
| openAnalyzer | `boolean`            | `true`        | 是否自动打开报告 |

## 🎯 使用场景

* 需要快速优化 Taro 项目性能的场景
* 希望简化多插件配置的项目
* 需要同时使用多个 @taro-minify-pack 系列插件的项目
* 对小程序主包体积有严格要求的项目

## ⚠️ 注意事项

1. **预打包冲突**：当启用 `asyncPack` 时，必须关闭 Taro 的预打包功能（`compiler.prebundle.enable = false`），否则会导致构建冲突。

2. **Babel 配置**：必须在 Babel 配置中添加 `'dynamic-import-node': process.env.TARO_ENV !== 'weapp'`，以确保异步加载功能在不同环境下正常工作。

3. **远程资源上传**：使用 `remoteAssets` 时，需要提供有效的上传适配器和配置信息，确保资源能够正确上传到远程服务器。

4. **基础库版本**：使用 `coverBrowsersList` 时，必须指定正确的微信小程序基础库版本，以确保生成的代码兼容目标环境。

5. **Webpack 版本**：该预设仅支持 Webpack 5 编译器，请确保 Taro 项目使用 `compiler.type = 'webpack5'`。

6. **remote-assets 插件版本兼容性**：
    - **Taro < 4.0.10**：由于 `@tarojs/webpack5-runner` 不支持使用绝对路径注册 PostCSS 插件，在低版本 Taro 中直接使用本插件可能会导致插件无法生效。如需在低版本中使用，请参考官方 Pull Request( `https://github.com/NervJS/taro/pull/18683/files` ) 自行 patch。
    - **Taro ≥ 4.0.10**：可直接使用，无需额外处理。

7. **async-pack 插件版本建议**：插件版本`0.0.5-alpha.x`尝试实现样式文件异步加载受微信机制影响存在无法优化的「闪屏样式丢失」,故`0.0.5`及以后版本不支持样式文件异步加载。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

> 该预设是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
