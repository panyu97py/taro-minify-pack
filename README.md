# Taro Minify Pack

一组面向 **Taro（Webpack5）小程序** 的主包体积优化插件与预设方案。  
通过 **主包代码异步拆分** 与 **静态资源远程化**，有效降低主包体积并提升首包加载成功率。

> 适用于：Taro + React + Webpack5

---

## ✨ Features

- 📦 基于微信 `require.async` 与自定义组件机制，实现安全可控的 `import()` 异步分包加载
- 🌐 自动上传本地静态资源并替换为远程地址，避免资源占用主包体积
- 🧩 提供开箱即用的 preset，零成本接入完整优化方案
- 🔌 各插件可独立使用，按需组合，无强依赖耦合

---

## 📦 Packages

| Package | Description |
|--------|------------|
| [`@taro-minify-pack/preset`](./packages/preset/README.md) | 预设方案（async-pack + remote-assets） |
| [`@taro-minify-pack/plugin-async-pack`](./packages/plugin-async-pack/README.md) | 主包公共代码与样式的异步拆分加载 |
| [`@taro-minify-pack/plugin-remote-assets`](./packages/plugin-remote-assets/README.md) | 静态资源自动上传并替换路径 |
| [`@taro-minify-pack/react-lazy-enhanced`](./packages/react-lazy-enhanced/README.md) | React 懒加载增强，解决异步样式不同步问题 |
---

## 📁 Repository Structure

```text
.
├── examples/
│   └── taro-react-demo/       # 示例项目
├── packages/
│   ├── taro-preset/                # 预设方案
│   ├── taro-plugin-async-pack/     # 主包异步拆分插件
│   ├── taro-plugin-remote-assets/  # 远程资源插件
│   └── react-lazy-enhanced/   # React 懒加载增强
└── README.md
