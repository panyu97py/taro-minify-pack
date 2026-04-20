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

📦 基于微信 `require.async` 实现分包异步加载（替代 `import()`）
🎨 利用组件 `styleIsolation` 实现样式分包加载（适用于非首屏）
🌐 静态资源自动上传并替换为远程地址，减小主包体积
🎯 根据小程序基础库动态生成 `browserslist`，减少冗余兼容代码
📊 编译阶段集成 `bundle` 分析，定位体积瓶颈
🧩 提供开箱即用 `preset`，快速接入
🔌 插件可独立使用，支持按需组合

## 📦 Packages

| Package                                                                                                           | Description                                                                    |
|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| <nobr>[`@taro-minify-pack/preset`](./packages/taro-preset/README.md)</nobr>                                       | 预设方案，集成 `async-pack`、`remote-assets`、`cover-browserslist`、`bundle-analyzer` 能力 |
| <nobr>[`@taro-minify-pack/plugin-bundle-analyzer`](./packages/taro-plugin-bundle-analyzer/README.md)</nobr>       | 调用`webpack-bundle-analyzer` 实现包体积分析能力                                          |
| <nobr>[`@taro-minify-pack/plugin-async-pack`](./packages/taro-plugin-async-pack/README.md)</nobr>                 | 主包公共代码与样式的异步拆分加载                                                               |
| <nobr>[`@taro-minify-pack/plugin-remote-assets`](./packages/taro-plugin-remote-assets/README.md)</nobr>           | 静态资源自动上传并替换路径                                                                  |
| <nobr>[`@taro-minify-pack/plugin-cover-browserslist`](./packages/taro-plugin-cover-browserslist/README.md)</nobr> | 基于小程序基础库版本生成并覆盖 browserslist                                                   |

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

|                           微信                            |                           支付宝                           |
|:-------------------------------------------------------:|:-------------------------------------------------------:|
| <img src="./assets/wechat-pay-code.JPG" height="200" /> | <img src="./assets/alipay-pay-code.JPG" height="200" /> |

感谢你的支持，开源不易 ❤️

### 🌟 其他支持方式

* 给仓库点一个 ⭐️
* 在 issue / discussion 分享你的使用反馈
* 在团队或社区中推荐本项目(辛苦帮忙推荐下，看能不能进 Taro 官方插件列表)
  * https://github.com/NervJS/taro/discussions/18715
  * https://github.com/NervJS/taro/issues/18817

这些都会对项目非常有帮助 🙌
