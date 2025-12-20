## @taro-minify-pack/preset
> 预设配置, 包含 `@taro-minify-pack/plugin-async-pack` 和 `@taro-minify-pack/plugin-remote-assets`

### 安装

#### npm 安装
```bash
npm install @taro-minify-pack/preset
```
#### yarn 安装
```bash
yarn add @taro-minify-pack/preset
```

#### pnpm 安装
```bash
pnpm add @taro-minify-pack/preset
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
    presets: [
        ['@taro-minify-pack/preset', {
            // 开启远程资源上传, 优化主包体积,与 `@taro-minify-pack/plugin-remote-assets` 插件配置一致
            remoteAssets: {
                pathAlias: {
                    '@': path.resolve(__dirname, '../src/'),
                    '~@': path.resolve(__dirname, '../src/'),
                },
                assetsDirPath: path.resolve(__dirname, '../src/assets/'),
                uploader: aliOssUploadAdapter({
                    customDomain:'https://your-custom-domain.com',
                    accessKeyId: 'your-access-key-id',
                    accessKeySecret: 'your-access-key-secret',
                    bucket: 'your-bucket-name',
                    bucketDir: 'bucketDir',
                    region: 'your-region',
                })
            },
            // 开启异步加载主包代码, 优化主包体积,也可以自定义与 `@taro-minify-pack/plugin-async-pack` 插件配置一致
            asyncPack: true
        }],
    ],
};
```
