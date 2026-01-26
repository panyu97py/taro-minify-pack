<div align="center">
  <h1>Taro Minify Pack</h1>
  <p> 一组面向 <strong>Taro（Webpack5）小程序</strong> 的主包体积优化插件与预设方案。</p>
  <p> 通过 <strong>分包异步加载</strong>、<strong>静态资源远程化</strong> 与 <strong>减少兼容代码编译输出</strong>，降低主包体积。</p>
  <a href="https://www.npmjs.com/package/@taro-minify-pack/preset">
    <img src="https://img.shields.io/npm/v/@taro-minify-pack/preset.svg?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/@taro-minify-pack/preset">
    <img src="https://img.shields.io/npm/l/@taro-minify-pack/preset.svg?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/@taro-minify-pack/preset">
    <img src="https://img.shields.io/npm/dt/@taro-minify-pack/preset.svg?style=flat-square">
  </a>
  <a href="https://github.com/panyu97py/taro-minify-pack">
    <img src="https://img.shields.io/github/commit-activity/w/panyu97py/taro-minify-pack" alt="GitHub commit activity">
  </a>
</div>

## ✨ Features

- 📦 基于微信 `require.async` 实现动态`import()`分包异步加载
- 🌐 自动上传本地静态资源并替换为远程地址，避免资源占用主包体积
- 🎯 基于微信小程序 **基础库版本** 动态生成 `browserslist`，避免兼容代码占用主包体积
- 📊 在 Taro Webpack 编译阶段 注入 webpack-bundle-analyzer，生成主包 / 分包体积分析结果，用于定位体积瓶颈与优化收益
- 🧩 提供开箱即用的 preset，零成本接入完整优化方案
- 🔌 各插件可独立使用，按需组合，无强依赖耦合

## 📦 Packages

| Package                                                                                              | Description                                                                    |
|------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| [`@taro-minify-pack/preset`](./packages/taro-preset/README.md)                                       | 预设方案，集成 `async-pack`、`remote-assets`、`cover-browserslist`、`bundle-analyzer` 能力 |
| [`@taro-minify-pack/plugin-bundle-analyzer`](./packages/taro-plugin-bundle-analyzer/README.md)       | 调用`webpack-bundle-analyzer` 实现包体积分析能力                                          |
| [`@taro-minify-pack/plugin-async-pack`](./packages/taro-plugin-async-pack/README.md)                 | 主包公共代码与样式的异步拆分加载                                                               |
| [`@taro-minify-pack/plugin-remote-assets`](./packages/taro-plugin-remote-assets/README.md)           | 静态资源自动上传并替换路径                                                                  |
| [`@taro-minify-pack/plugin-cover-browserslist`](./packages/taro-plugin-cover-browserslist/README.md) | 基于小程序基础库版本生成并覆盖 browserslist                                                   |
| [`@taro-minify-pack/react-lazy-enhanced`](./packages/react-lazy-enhanced/README.md)                  | React 懒加载增强，解决异步组件样式不同步问题                                                      |

## 📁 Repository Structure

```text
.
├── examples/
│   └── taro-react-demo/                # 示例项目
├── packages/
│   ├── taro-preset/                    # 预设方案
│   ├── taro-plugin-bundle-analyzer/    # 包体积分析插件
│   ├── taro-plugin-async-pack/         # 主包异步拆分插件
│   ├── taro-plugin-remote-assets/      # 远程资源插件
│   ├── taro-plugin-cover-browserslist  # browserslist 覆盖插件
│   └── react-lazy-enhanced/            # React 懒加载增强
└── README.md
```
## ❤️ 支持项目 / Sponsor

如果 Taro Minify Pack 在你的项目中帮你： 
* 成功压缩了主包体积 📦
* 节省了排查体积问题的时间 ⏱️

欢迎通过打赏的方式支持项目持续维护与迭代 🙏

你的支持将用于： 
* 新版本 Taro / 基础库适配
* 性能优化与稳定性改进
* 文档、示例与最佳实践完善

开源不易，感谢你的认可 ❤️

### ☕️ 请作者喝杯咖啡

如果这个项目对你有帮助，可以请作者喝杯咖啡 ☕
每一份支持，都会转化为更稳定、更好用的优化方案。

| 微信 | 支付宝 |
|:---:|:---:|
| <img src="./assets/wechat-pay-code.JPG" height="200" /> | <img src="./assets/alipay-pay-code.JPG" height="200" /> |

感谢你的支持，开源不易 ❤️

### 🌟 其他支持方式
* 给仓库点一个 ⭐️
* 在 issue / discussion 分享你的使用反馈
* 在团队或社区中推荐本项目

这些都会对项目非常有帮助 🙌
