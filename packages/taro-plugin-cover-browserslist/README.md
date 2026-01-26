# @taro-minify-pack/plugin-cover-browserslist

> 自动根据微信小程序基础库版本设置合适的 browserslist，优化编译结果，减少代码体积。

该插件会在构建开始时检查当前 Taro 环境，如果是微信小程序（weapp）环境，则根据配置的基础库版本自动设置 BROWSERSLIST 环境变量，从而影响 Babel、PostCSS 等工具的编译行为，只针对目标环境进行兼容处理，减少不必要的 polyfill 和兼容代码。

## ✨ 功能特性

* 🎯 自动根据微信小程序基础库版本设置 browserslist
* 📦 减少不必要的 polyfill 和兼容代码，优化编译结果
* 🚀 提升小程序运行性能
* 💡 配置简单，易于使用
* 📱 仅在微信小程序环境下生效，不影响其他平台

## 📦 安装

### npm

```sh
npm install @taro-minify-pack/plugin-cover-browserslist
```

### yarn

```sh
yarn add @taro-minify-pack/plugin-cover-browserslist
```

### pnpm

```sh
pnpm add @taro-minify-pack/plugin-cover-browserslist
```

## 🔧 使用配置

### 插件参数说明

| 参数名                     | 是否必填 | 类型       | 默认值 | 说明                       |
|-------------------------|------|----------|-----|--------------------------|
| `minBaseLibraryVersion` | 是    | `string` | -   | 微信小程序基础库最低版本号，如 "2.14.4" |

### 示例配置

```js
// config/index.js
module.exports = {
    plugins: [
        ['@taro-minify-pack/plugin-cover-browserslist', {
            // 设置微信小程序基础库最低版本
            minBaseLibraryVersion: '2.14.4',
        }],
    ],
}
```

```ts
// config/index.ts
import { defineConfig } from '@tarojs/cli'

export default defineConfig({
    plugins: [
        ['@taro-minify-pack/plugin-cover-browserslist', {
            // 设置微信小程序基础库最低版本
            minBaseLibraryVersion: '2.14.4',
        }],
    ],
})
```

## 🧠 工作原理

1. **构建开始**：插件在 Taro 构建开始时触发
2. **环境检查**：
   - 检查当前环境是否为微信小程序（`TARO_ENV=weapp`）
   - 检查是否配置了基础库版本
3. **获取 browserslist**：使用 `miniprogram-compat` 库根据基础库版本获取对应的 browserslist
4. **设置环境变量**：将获取到的 browserslist 配置设置为 `BROWSERSLIST` 环境变量
5. **影响编译**：Babel、PostCSS 等工具会读取该环境变量，只生成目标环境所需的兼容代码

### 技术依赖

- **Taro Service**：Taro 插件系统
- **miniprogram-compat**：提供微信小程序基础库版本与 browserslist 的映射关系

## 📌 适用场景

* 需要优化微信小程序代码体积的项目
* 对小程序运行性能有较高要求的项目
* 明确了支持的微信小程序基础库版本的项目
* 希望减少不必要的 polyfill 和兼容代码的项目

## ⚠️ 注意事项

1. **仅支持微信小程序**：该插件仅在微信小程序环境（`TARO_ENV=weapp`）下生效
2. **基础库版本选择**：请根据项目实际支持的最低基础库版本进行配置
3. **依赖工具**：确保项目中使用的 Babel、PostCSS 等工具支持 browserslist 配置
4. **环境变量**：插件会覆盖现有的 `BROWSERSLIST` 环境变量，请确保不会与其他配置冲突

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
