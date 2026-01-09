## @taro-minify-pack/plugin-async-pack
> 异步加载主包代码, 优化主包体积（包含异步模块`js`与样式文件）

### 安装

#### npm 安装
```bash
npm install @taro-minify-pack/plugin-async-pack @taro-minify-pack/react-lazy-enhanced
```
#### yarn 安装
```bash
yarn add @taro-minify-pack/plugin-async-pack @taro-minify-pack/react-lazy-enhanced
```

#### pnpm 安装
```bash
pnpm add @taro-minify-pack/plugin-async-pack @taro-minify-pack/react-lazy-enhanced
```
### 配置

#### `babel`配置
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
#### `Taro` 配置
```js
// config/index.js
module.exports = {
    compiler: {
        type: 'webpack5',
        prebundle: {
            // 关闭预打包,这里和分包异步编译有冲突，当然如果只是 production 环境用异步分包的话就无所谓了
            enable: false,
        }
    },
    plugins: [
        ['@taro-minify-pack/plugin-async-pack', {
            // 异步分包名前缀
            dynamicPackageNamePrefix: 'dynamic-common',
            // 异步分包数量
            dynamicPackageCount: 2
        }],
    ],
};
```

### 使用
```ts
const module = await import('./dynamic-module')
```
