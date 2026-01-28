# @taro-minify-pack/lazy-enhanced-vue

Vue 异步组件增强版，专为 Taro 小程序环境优化，解决异步组件样式加载问题。

## ✨ 功能特性

- **增强的异步组件**：在 Vue 的 `defineAsyncComponent` 基础上提供额外功能
- **样式加载确认**：每次组件初始化时调用加载器函数，确保样式加载完成
- **与 Taro 插件深度集成**：配合 `taro-plugin-async-pack` 插件使用，配置其 webpack runtime 改造解决异步样式加载问题
- **可靠的异步加载支持**：确保异步组件的样式和 JavaScript 都能正确加载
- **自动预加载机制**：组件初始化时自动预加载异步模块
- **类型安全**：完整的 TypeScript 类型支持

## 📦 安装

### npm 安装

```bash
npm install @taro-minify-pack/lazy-enhanced-vue
```

### yarn 安装

```bash
yarn add @taro-minify-pack/lazy-enhanced-vue
```

### pnpm 安装

```bash
pnpm add @taro-minify-pack/lazy-enhanced-vue
```

## 🚀 使用

### 与 Taro 插件配合使用（推荐）

**注意**：此包可以与 `@taro-minify-pack/plugin-async-pack` 插件配合使用，插件会自动将所有 `defineAsyncComponent`
调用转换为使用此增强版实现：

```vue
<!-- 插件会自动将以下代码转换为使用 @taro-minify-pack/lazy-enhanced-vue -->
<script setup lang="ts">
  import {defineAsyncComponent} from 'vue'

  const DynamicComponent = defineAsyncComponent(() => import('./DynamicComponent.vue'))
</script>

<template>
  <DynamicComponent/>
</template>
```

### 手动使用

```vue

<script setup lang="ts">
  import {defineAsyncComponentEnhanced} from '@taro-minify-pack/lazy-enhanced-vue'

  const DynamicComponent = defineAsyncComponentEnhanced(() => import('./DynamicComponent.vue'))
</script>

<template>
  <DynamicComponent/>
</template>
```

## 📝 工作原理

### 核心作用

由于 `taro-plugin-async-pack` 改造了 webpack 的 dist runtime，异步组件的 JavaScript 和样式文件会被分离到不同的异步分包中。
`@taro-minify-pack/lazy-enhanced-vue` 的核心作用是**确保在组件初始化时，异步模块的样式文件已经加载完成**。

### 工作流程

1. **组件初始化**：当异步组件首次渲染时
2. **调用加载器函数**：强制调用异步组件的加载器函数，触发异步模块和样式的加载
3. **等待加载完成**：通过内部机制等待模块和样式加载完成
4. **渲染组件**：确保样式就绪后才渲染实际组件内容
5. **透明使用**：对开发者来说使用方式与原生 `defineAsyncComponent` 完全一致

### 与原生 defineAsyncComponent 的关键区别

原生 Vue 的 `defineAsyncComponent` 在 Web 环境中：

- JS 模块会被保存在内存中
- CSS 模块通过 `<style>` 标签插入，只需插入一次就会被浏览器缓存

但在 Taro 小程序环境中，由于 `taro-plugin-async-pack` 对 webpack runtime 的改造，异步样式加载机制完全不同：

- 样式文件被单独打包到异步分包中
- 通过向每个页面插入自定义组件的方式实现样式加载
- 每次页面重新加载都需要重新注入样式，无法像 Web 环境那样缓存

这种差异可能导致组件已加载但样式未就绪的问题。`@taro-minify-pack/lazy-enhanced-vue` 通过每次组件初始化时重新调用加载器函数的方式，确保异步模块的
JavaScript 和样式文件都能被正确加载并应用到当前页面。

### 关键实现代码

```typescript
export const defineAsyncComponentEnhanced = <T extends Component = Instance>(source: Source<T>): T => {
    const loader = (() => {
        const isFunctionSource = typeof source === 'function'
        return isFunctionSource ? source : source.loader
    })()

    const AsyncComponent = defineAsyncComponent(source)

    const SuspenseTrigger = defineComponent({
        name: 'SuspenseTrigger',
        async setup() {
            await loader()
            return () => null
        }
    })

    return defineComponent({
        name: 'AsyncComponentWrapper',
        setup(_, ctx) {
            return () => {
                const suspenseTriggerVNode = h(SuspenseTrigger)
                const asyncComponentVNode = h(AsyncComponent, ctx.attrs, ctx.slots)
                return h(Fragment, [suspenseTriggerVNode, asyncComponentVNode])
            }
        }
    }) as T
}
```

## 🆚 与原生 defineAsyncComponent 的区别

| 特性                     | Vue defineAsyncComponent | @taro-minify-pack/lazy-enhanced-vue |
|------------------------|--------------------------|-------------------------------------|
| **基础异步组件功能**           | ✅ 支持                     | ✅ 支持                                |
| **模块加载策略**             | 一次加载，缓存复用                | 每次组件初始化都重新调用加载器函数                   |
| **样式加载机制**             | Web：CSS 通过 style 标签插入并缓存 | 小程序：通过自定义组件注入样式，每次页面加载需重新注入         |
| **与 Taro 插件集成**        | ❌ 无特殊集成                  | ✅ 与 `taro-plugin-async-pack` 深度配合   |
| **webpack runtime 适配** | ❌ 无特殊适配                  | ✅ 适配改造后的 webpack runtime            |
| **使用场景**               | 通用 Vue 应用                | Taro 小程序、需要确保样式加载的场景                |

## ⚠️ 注意事项

1. **与 Taro 插件的关系**：此包可以与 `@taro-minify-pack/plugin-async-pack` 插件配合使用，单独使用时也能提供基本的异步组件功能
2. **性能考虑**：由于每次组件初始化都会调用加载器函数，可能会增加网络请求。但在小程序环境中，这种额外开销通常是可接受的，且能确保样式正确加载
3. **版本兼容性**：需要 Vue 3.x 版本支持
4. **样式配置**：确保 Taro 项目的样式配置正确，特别是在使用异步分包时

## 🔧 API

### `defineAsyncComponentEnhanced`

**类型**：`<T extends Component>(source: AsyncComponentLoader<T> | AsyncComponentOptions<T>) => T`

**描述**：创建一个增强的异步组件，确保每次初始化时样式加载完成

**参数**：

- `source`: 异步组件加载器函数或配置对象，支持 Vue 3 的所有 `defineAsyncComponent` 参数格式

**返回值**：

- 返回一个增强的异步组件，使用方式与原生 `defineAsyncComponent` 完全一致

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

> 该包是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。
