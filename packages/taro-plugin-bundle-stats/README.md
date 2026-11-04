# @taro-minify-pack/plugin-bundle-stats

集成 bundle-stats-webpack-plugin 到 Taro 项目，可视化分析打包结果，帮助优化代码体积和依赖关系。

## ✨ 功能特性

- **打包报告生成**：自动生成 HTML / JSON 格式的 Bundle Stats 报告，可视化展示打包结果
- **基线对比**：支持与基线版本对比，直观展示资源、模块、依赖的变化趋势
- **主包分析**：自动识别主包资源与模块，按业务模块 / 依赖模块分类展示
- **重点指标关注**：类型中提供重点关注配置；当前插件尚未将该配置传入摘要生成函数
- **摘要报告**：构建完成后自动生成 Markdown 格式的摘要报告，方便在 CI 或消息通知中使用
- **报告上传**：支持自定义上传函数，将报告产物上传至 OSS 等存储服务

## 📦 安装

```bash
npm install @taro-minify-pack/plugin-bundle-stats
```

### yarn 安装
```bash
yarn add @taro-minify-pack/plugin-bundle-stats
```

### pnpm 安装
```bash
pnpm add @taro-minify-pack/plugin-bundle-stats
```

## ⚙️ 配置

### Taro 配置
```js
// config/index.js
module.exports = {
  plugins: [
    ['@taro-minify-pack/plugin-bundle-stats', {
      // 报告输出目录（相对于项目根目录），默认为 'bundleStatsReport'
      reportPath: 'bundleStatsReport',
      // 首次构建没有基线文件时设为空字符串，跳过基线加载
      baselinePath: '',
      // 是否生成 HTML 报告，默认为 true
      html: true,
      // 是否生成 JSON 报告，默认为 true
      json: true,
      // 是否与基线对比，默认为 true
      compare: true,
      // 是否保存基线，默认为 true
      baseline: true,
    }],
  ],
};
```

## 🚀 使用

### 基本使用

安装并配置插件后，执行 Taro 构建命令即可自动生成 Bundle Stats 报告：

```bash
taro build --type weapp
```

构建完成后，在项目根目录的 `bundleStatsReport/` 目录下会生成以下文件：

- `bundle-stats.html` — 可视化 HTML 报告
- `bundle-stats.json` — JSON 格式原始数据
- `baseline.json` — 当前构建的基线文件（供下次对比使用）
- `summary-report.md` — Markdown 格式摘要报告

### 基线对比

首次构建没有基线文件时，请设置 `baselinePath: ''`，避免默认配置尝试复制不存在的 `baseline.json` 而报错。启用 `baseline: true` 后，当前基线输出到 `bundleStatsReport/baseline.json`，后续构建仍可保留空字符串以使用该文件。

如需固定对比基线，请在构建前将生成的文件另存为制品，并将 `baselinePath` 指向该文件或远程 URL。非空本地路径按构建进程的工作目录解析；指向报告目录内同一个基线文件时，应使用绝对路径以跳过复制。

如果需要与远程基线对比，可以配置 `baselinePath` 为 HTTP URL：

```js
plugins: [
  ['@taro-minify-pack/plugin-bundle-stats', {
    baselinePath: 'https://your-cdn.com/baseline.json',
  }],
]
```

### 重点关注指标

`reportConfig` 的类型定义包含以下选项，但当前插件调用 `summarizeReport` 时未传入该配置，因此 `focusMetricRun` 和 `displayLimit` 暂不生效，摘要仍使用默认展示上限 20。以下仅展示配置结构：

```js
plugins: [
  ['@taro-minify-pack/plugin-bundle-stats', {
    reportConfig: {
      focusMetricRun: {
        // 重点关注资源路径
        assets: ['pages/index/index.js', 'common/vendor.js'],
        // 重点关注模块名称
        modules: ['lodash'],
        // 重点关注依赖包名称
        packages: ['lodash', 'dayjs'],
      },
      // 摘要报告中模块展示数量上限，默认为 20
      displayLimit: 30,
    },
  }],
]
```

### 上传报告

通过 `upload` 配置自定义上传函数，将报告产物上传至 OSS 等存储服务：

```js
const { aliOssUploadAdapter } = require('@taro-minify-pack/helper')

const ossUploader = aliOssUploadAdapter({
  region: 'oss-cn-hangzhou',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  bucket: 'your-bucket',
})

module.exports = {
  plugins: [
    ['@taro-minify-pack/plugin-bundle-stats', {
      baselinePath: '',
      upload: ossUploader,
    }],
  ],
}
```

使用该示例前需安装 `@taro-minify-pack/helper`。配置 `upload` 后，可通过 Taro CLI 执行上传命令：

```bash
taro upload-bundle-stats-report
```

## 📝 工作原理

1. **Webpack 插件注入**：在构建阶段通过 `ctx.modifyWebpackChain` 将 `BundleStatsWebpackPlugin` 注入到 Webpack 配置中，生成 HTML / JSON 报告和基线文件

2. **基线文件加载**：在构建开始前（`ctx.onBuildStart`），如果 `baselinePath` 为远程 URL，会自动下载基线文件到本地报告目录；如果为本地路径，则直接拷贝

3. **摘要报告生成**：在构建完成后（`ctx.onBuildComplete`），读取 `bundle-stats.json` 和 `app.json`，按主包 / 分包维度分析资源与模块，生成 `summary-report.md` 摘要报告

4. **报告上传**：注册 `upload-bundle-stats-report` CLI 命令，调用 `@taro-minify-pack/helper` 的 `uploadAssets` 方法，将报告目录下的所有文件上传至指定存储

## ⚠️ 注意事项

1. **仅支持 Webpack 5**：当前插件依赖 `bundle-stats-webpack-plugin`，仅适用于 Webpack 5 编译器
2. **基线文件**：首次构建没有基线时设置 `baselinePath: ''`；建议在 CI 环境中将报告目录中的 `baseline.json` 作为制品保存
3. **报告目录**：`reportPath` 目录位于项目根目录下，建议在 `.gitignore` 中忽略该目录
4. **远程基线**：`baselinePath` 支持 HTTP/HTTPS URL，插件会在构建前自动下载

## 🔧 配置选项

| 选项名 | 类型 | 默认值 | 描述 |
|-------|------|-------|------|
| `html` | `boolean` | `true` | 是否生成 HTML 报告 |
| `json` | `boolean` | `true` | 是否生成 JSON 报告 |
| `compare` | `boolean` | `true` | 是否与基线对比 |
| `baseline` | `boolean` | `true` | 是否保存基线文件 |
| `baselinePath` | `string` | `'baseline.json'` | 基线文件路径，支持本地路径或远程 URL；空字符串跳过加载，非空本地路径必须存在 |
| `reportPath` | `string` | `'bundleStatsReport'` | 报告输出目录（相对于项目根目录） |
| `upload` | `Uploader` | — | 自定义上传函数，用于上传报告产物 |
| `stats` | `Partial<WebpackStatsOptions>` | — | Webpack Stats 输出选项 |
| `reportConfig` | `object` | — | 摘要报告配置，当前尚未传入摘要生成函数 |

### `reportConfig` 配置说明

```ts
interface ReportConfig {
  focusMetricRun?: {
    assets?: string[]
    modules?: string[]
    packages?: string[]
  }
  displayLimit?: number
}
```

- `focusMetricRun.assets`：重点关注的资源路径列表，在摘要报告中单独展示
- `focusMetricRun.modules`：重点关注的模块名称列表，按完整名称匹配
- `focusMetricRun.packages`：重点关注的依赖包名称列表，在摘要报告中单独展示
- `displayLimit`：摘要报告中业务模块 / 依赖模块的展示数量上限，默认为 20

### `stats` 配置说明

```ts
interface WebpackStatsOptions {
  assets?: boolean
  chunks?: boolean
  modules?: boolean
  hash?: boolean
  builtAt?: boolean
}
```

- `assets`：是否输出资源信息，默认 `true`
- `chunks`：是否输出 chunk 信息，默认 `true`
- `modules`：是否输出模块信息，默认 `true`
- `hash`：是否输出构建 hash 信息，默认 `true`
- `builtAt`：是否输出构建时间信息，默认 `true`

## 🤝 常见问题

### 1. 构建后没有生成报告？
- 请确认插件已正确配置在 `plugins` 数组中
- 确认使用的是 Webpack 5 编译器（`compiler.type` 为 `webpack5`）
- 检查构建日志中是否有 `bundle-stats` 相关错误

### 2. 摘要报告没有生成？
- 确认构建成功完成，`bundle-stats.json` 和 `app.json` 文件都已生成
- 如果 `bundle-stats.json` 不存在，可能是 `json` 选项被关闭了，请确保 `json: true`

### 3. 基线对比没有数据？
- 首次构建没有基线文件，Delta 列为空是正常的
- 确认 `baseline: true` 以保存基线文件供下次对比
- 如果使用远程基线，确认 URL 可访问且文件格式正确

### 4. 上传报告失败？
- 确认 `upload` 函数配置正确，可参考 `@taro-minify-pack/helper` 的上传适配器
- 检查网络连接和存储服务权限
- 确认通过 `taro upload-bundle-stats-report` 命令执行上传

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
