# @taro-minify-pack/plugin-async-pack

异步加载主包代码，优化主包体积（仅包含异步模块`js`文件）

## ✨ 功能特性

- **主包体积优化**：将动态导入的模块自动拆分到异步分包，有效减少主包体积
- **灵活配置**：可自定义异步分包名称前缀和数量
- **自动化处理**：自动修改小程序配置文件，无需手动操作
- **性能提升**：减少小程序启动时间，提升用户体验

## 📦 安装

```bash
npm install @taro-minify-pack/plugin-async-pack
```

### yarn 安装
```bash
yarn add @taro-minify-pack/plugin-async-pack
```

### pnpm 安装
```bash
pnpm add @taro-minify-pack/plugin-async-pack
```

## ⚙️ 配置

### `babel`配置
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

### `Taro` 配置
```js
// config/index.js
module.exports = {
    compiler: {
        type: 'webpack5',
        prebundle: {
            // 关闭预打包,这里和分包异步编译有冲突
            enable: false,
        }
    },
    plugins: [
        ['@taro-minify-pack/plugin-async-pack', {
            // 异步分包名前缀，默认为 'dynamic-package'
            dynamicPackageNamePrefix: 'dynamic-package',
            // 异步分包数量，默认为 1
            dynamicPackageCount: 2,
            // 自定义异步分包，最终输出目录格式为 `${dynamicPackageNamePrefix}-${name}`
            customDynamicPackages: [
                {
                    name: 'report',
                    test: (module) => /src[\\/]pages[\\/]report[\\/]/.test(module.resource || ''),
                    // 异步分包是否异步加载样式，默认为 false，设置为 true 后，该分包下的样式文件会被异步加载（由于异步加载样式存在延时时机不可控，建议仅用于非页面首屏组件）
                    asyncStyle: true
                }
            ]
        }],
    ],
};
```

## 🚀 使用

### 基本使用
```ts
// 动态导入模块
const module = await import('./dynamic-module')
```

### React 组件懒加载
```tsx
import { lazy, Suspense } from 'react'

const DynamicComponent = lazy(() => import('./DynamicComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DynamicComponent />
    </Suspense>
  )
}
```

### Vue 组件懒加载
```vue
<template>
  <view class="index">
    <Suspense>
      <template #default>
         <AsyncComponent/>
      </template>
      <template #fallback>
        <view>loading...</view>
      </template>
    </Suspense>
  </view>
</template>

<script setup>
import {defineAsyncComponent, ref} from 'vue'
const AsyncComponent = defineAsyncComponent(() => import('./async-component')
)
</script>
```

## 📝 工作原理

1. **Webpack 配置修改**：
   - 覆盖 `splitChunks` 规则，使`common`与`vendors`只处理同步模块
   - 配置 `chunkFilename` 生成规则，确保异步模块正确输出到指定分包
   - 修改 `miniCssExtractPlugin` 配置，确保异步模块的样式文件也能正确拆分到指定目录
   - 修改 `runtime.js` 输出，确保异步模块的`js`文件能通过`require.async`正确引入

2. **样式处理**：
   - 为每个异步分包生成样式组件
   - 自动收集该分包下的所有样式文件并通过 `@import` 引入主包`app.wxss`同步引入

3. **小程序配置修改**：
   - 自动修改 `app.json`，添加异步分包配置

## ⚠️ 注意事项

1. **仅支持微信小程序**：当前插件仅适用于微信小程序环境
2. **关闭预打包**：必须关闭 Taro 的预打包功能，否则可能与异步分包功能冲突
3. **Babel 配置**：需要正确配置 Babel 的 `dynamic-import-node` 选项
4. **Webpack 版本**：仅支持 Webpack 5 编译器
5. **分包数量**：根据项目实际情况配置 `dynamicPackageCount`，过多的分包可能会影响性能
6. **版本要求**：插件版本`0.0.5-alpha.x`尝试实现样式文件异步加载受微信机制影响存在无法优化的「闪屏样式丢失」,故`0.0.5`及以后版本不支持样式文件异步加载。

## 🔧 配置选项

| 选项名                        | 类型                       | 默认值                | 描述        |
|----------------------------|--------------------------|--------------------|-----------|
| `dynamicPackageNamePrefix` | `string`                 | `'dynamic-package'` | 异步分包名称前缀  |
| `dynamicPackageCount`      | `number`                 | `1`                | 异步分包数量    |
| `customDynamicPackages`    | `CustomDynamicPackage[]` | `[]`               | 自定义异步分包配置 |

### `customDynamicPackages` 配置说明

```ts
interface CustomDynamicPackage {
  name: string
  test: string | RegExp | ((module, context) => boolean)
  asyncStyle?: boolean
}
```

- `name`：自定义异步分包标识，最终会拼成 `${dynamicPackageNamePrefix}-${name}`，例如 `dynamic-package-report`
- `test`：直接透传给 webpack `splitChunks.cacheGroups[packageName].test`，命中的异步模块会被拆到该分包
- `asyncStyle`：默认 `false`。开启后会为该分包额外生成 `inject-style` 组件，并自动注入到页面模板中，让该分包内样式跟随组件异步加载

### `customDynamicPackages` 配置示例

```js
plugins: [
  ['@taro-minify-pack/plugin-async-pack', {
    dynamicPackageNamePrefix: 'dynamic-package',
    dynamicPackageCount: 2,
    customDynamicPackages: [
      {
        name: 'vendors',
        test: /[\\/]node_modules[\\/](lodash-es|dayjs)[\\/]/
      },
      {
        name: 'report',
        test: (module) => /src[\\/]pages[\\/]report[\\/]/.test(module.resource || ''),
        asyncStyle: true
      }
    ]
  }]
]
```

上述配置会额外生成 `dynamic-package-vendors` 和 `dynamic-package-report` 两个异步分包；其中 `report` 分包会同时产出 `inject-style` 组件，并在编译时自动追加到 `app.json` 与页面模板中。

## 🤝 常见问题

### 1. 异步模块没有被拆分到分包？
- 请检查是否正确配置了 `dynamic-import-node` 选项
- 确保已关闭 Taro 的预打包功能
- 确认使用了 Webpack 5 编译器
- 确保代码中使用了 `import()` 动态导入语法

### 2. 异步组件的样式没有加载？
- 检查是否有编译错误或警告信息

### 3. 配置后编译失败？
- 请检查配置选项是否正确
- 确认 Taro 版本与插件版本兼容
- 查看编译日志，排查具体错误原因

### 4. 页面加载时出现白屏？
- 请检查是否正确使用了 `Suspense` 组件包裹异步组件
- 确保异步组件的导入路径正确
- 检查网络请求是否正常

### 5. 分包数量配置后没有生效？
- 请确保 `dynamicPackageCount` 配置的值大于0
- 检查是否有足够的动态导入模块来拆分到多个分包

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
