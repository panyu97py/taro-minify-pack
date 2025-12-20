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

