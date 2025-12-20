# `Taro` 小程序主包体积优化插件
>  由于 `@tarojs/webpack5-runner` 不支持绝对路径注册 `postcss` 插件注册注册,使用`@taro-minify-pack/plugin-remote-assets`需要参考[pullRequest](https://github.com/NervJS/taro/pull/18683/files)自行 patch
## TODO
* `aliOssUploadAdapter` 没有 oss 资源，待验证
* `uploadAdapter` 适配更多平台（偷个懒，先实现 `aliOssUploadAdapter`）
* `npm` 包还未发布, 待发布

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


## @taro-minify-pack/plugin-async-pack
> 异步加载主包代码, 优化主包体积
>
> 注：异步模块样式文件无法异步加载，已默认在主包样式文件中引入

### 安装

#### npm 安装
```bash
npm install @taro-minify-pack/plugin-async-pack
```
#### yarn 安装
```bash
yarn add @taro-minify-pack/plugin-async-pack
```

#### pnpm 安装
```bash
pnpm add @taro-minify-pack/plugin-async-pack
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
            // js 异步分包名
            dynamicModuleJsDir: 'dynamic-common',
            // 异步模块样式文件名
            dynamicModuleStyleFile: 'dynamic-common'
        }],
    ],
};
```

### 使用
```ts
const module = await import('./dynamic-module')
```

## @taro-minify-pack/plugin-remote-assets
> 自动上传资源文件并替换路径
>
> 注：由于 `@tarojs/webpack5-runner` 不支持绝对路径注册 `postcss` 插件注册注册,已向`Taro`官方提交[pullRequest](https://github.com/NervJS/taro/pull/18683),有需要的可以参考[pullRequest](https://github.com/NervJS/taro/pull/18683/files)自行 patch


### 安装

```bash
npm install @taro-minify-pack/plugin-remote-assets
```
#### yarn 安装
```bash
yarn add @taro-minify-pack/plugin-remote-assets
```

#### pnpm 安装
```bash
pnpm add @taro-minify-pack/plugin-remote-assets
```

### 配置
```js
// config/index.js
module.exports = {
    plugins: [
        ['@taro-minify-pack/plugin-remote-assets', {
            // 路径别名
            pathAlias: {
                '@': path.resolve(__dirname, '../src/'),
                '~@': path.resolve(__dirname, '../src/'),
            },
            // 资源文件目录
            assetsDirPath: path.resolve(__dirname, '../src/assets/'),
            // 上传适配器
            uploader: aliOssUploadAdapter({
                customDomain:'https://your-custom-domain.com',
                accessKeyId: 'your-access-key-id',
                accessKeySecret: 'your-access-key-secret',
                bucket: 'your-bucket-name',
                bucketDir: 'bucketDir',
                region: 'your-region',
            })
        }],
    ],
};
```

