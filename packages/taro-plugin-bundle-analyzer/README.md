# @taro-minify-pack/plugin-bundle-analyzer

> 集成 webpack-bundle-analyzer 到 Taro 项目，可视化分析打包结果，帮助优化代码体积和依赖关系。

该插件将 webpack-bundle-analyzer 无缝集成到 Taro 项目的构建流程中，提供直观的打包结果可视化分析，帮助开发者识别和优化大型依赖、重复代码和不必要的资源，从而减少项目体积，提升应用性能。

## ✨ 功能特性

* 📊 直观的打包结果可视化分析
* 📦 展示各模块、依赖的大小和占比
* 🔍 支持放大缩小、拖拽、搜索等交互功能
* 🚀 自动在浏览器中打开分析报告
* ⚙️ 支持自定义配置（端口、主机、是否自动打开等）
* 🔧 与 Taro 项目无缝集成，无需额外配置

## 📦 安装

### npm

```sh
npm install @taro-minify-pack/plugin-bundle-analyzer
```

### yarn

```sh
yarn add @taro-minify-pack/plugin-bundle-analyzer
```

### pnpm

```sh
pnpm add @taro-minify-pack/plugin-bundle-analyzer
```

## 🔧 使用配置

### 插件参数说明

| 参数名            | 是否必填 | 类型                 | 默认值           | 说明                      |
|----------------|------|--------------------|---------------|-------------------------|
| `analyzerHost` | 否    | `string`           | `'127.0.0.1'` | 服务器主机地址                 |
| `analyzerPort` | 否    | `number \| 'auto'` | `8888`        | 服务器端口，'auto' 表示自动选择可用端口 |
| `openAnalyzer` | 否    | `boolean`          | `true`        | 是否自动在浏览器中打开报告           |

### 示例配置

```js
// config/index.js
module.exports = {
    plugins: [
        ['@taro-minify-pack/plugin-bundle-analyzer', {
            // 可选配置
            analyzerHost: '127.0.0.1',  // 服务器主机地址
            analyzerPort: 8888,         // 服务器端口
            openAnalyzer: true,         // 是否自动在浏览器中打开报告
        }],
    ],
}
```

```ts
// config/index.ts
import { defineConfig } from '@tarojs/cli'
import { BundleAnalyzerOpt } from '@taro-minify-pack/plugin-bundle-analyzer'

export default defineConfig({
    plugins: [
        ['@taro-minify-pack/plugin-bundle-analyzer', {
            // 可选配置
            analyzerHost: '127.0.0.1',  // 服务器主机地址
            analyzerPort: 8888,         // 服务器端口
            openAnalyzer: true,         // 是否自动在浏览器中打开报告
        } as BundleAnalyzerOpt],
    ],
})
```

### 基本用法

在配置文件中添加插件后，运行 Taro 构建命令：

```sh
taro build --type weapp  # 构建微信小程序
# 或
taro build --type h5      # 构建 H5
```

构建完成后，插件会自动启动分析服务器并在浏览器中打开可视化报告。

## 🧠 工作原理

1. **插件注册**：Taro 加载插件并初始化
2. **修改 webpack 配置**：在 webpack 配置中添加 BundleAnalyzerPlugin
3. **默认配置**：设置默认的分析选项（defaultSizes: 'parsed', analyzerMode: 'server'）
4. **构建触发**：当运行 Taro 构建命令时，webpack 会执行分析插件
5. **生成报告**：构建完成后，生成打包结果的可视化分析报告
6. **启动服务器**：启动本地服务器并在浏览器中打开报告

### 技术依赖

- **Taro Service**：Taro 插件系统
- **webpack-bundle-analyzer**：提供打包结果的可视化分析功能

## 📌 适用场景

* 需要分析和优化项目打包体积的 Taro 项目
* 想了解项目依赖关系和模块大小分布的开发者
* 需要识别大型依赖和重复代码的项目
* 对应用性能有较高要求的项目

## ⚠️ 注意事项

1. **开发依赖**：该插件是开发依赖，建议只在开发环境中使用
2. **构建时间**：启用分析会增加构建时间，生产环境建议关闭
3. **端口冲突**：如果默认端口（8888）被占用，可以通过 analyzerPort 配置修改
4. **浏览器支持**：确保使用现代浏览器打开分析报告，以获得最佳体验

## 🔍 功能展示

### 分析报告界面

构建完成后，您将在浏览器中看到类似以下的分析报告：

1. **模块树**：展示项目中所有模块的依赖关系和大小
2. **大小分布**：以可视化方式展示各模块的大小占比
3. **搜索功能**：可以搜索特定模块
4. **缩放功能**：支持放大缩小查看细节
5. **导出功能**：可以导出分析结果为 JSON 文件

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
