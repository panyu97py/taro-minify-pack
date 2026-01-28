# @taro-minify-pack/react-lazy-enhanced

React.lazy 增强版，专为 Taro 小程序环境优化，解决异步组件样式加载问题。

## ✨ 功能特性

- **增强的懒加载**：在 React.lazy 基础上提供额外功能
- **样式加载确认**：每次组件初始化时调用工厂函数，确保样式加载完成
- **与 Taro 插件深度集成**：配合 `taro-plugin-async-pack` 插件使用，配置其 webpack runtime 改造解决异步样式加载问题
- **可靠的 Suspense 支持**：确保 Suspense fallback 被正确触发
- **自动重置机制**：组件卸载时自动重置加载状态
- **类型安全**：完整的 TypeScript 类型支持

## 📦 安装

### npm 安装

```bash
npm install @taro-minify-pack/react-lazy-enhanced
```

### yarn 安装

```bash
yarn add @taro-minify-pack/react-lazy-enhanced
```

### pnpm 安装

```bash
pnpm add @taro-minify-pack/react-lazy-enhanced
```

## 🚀 使用

### 与 Taro 插件配合使用（必需）

**注意**：此包必须与 `@taro-minify-pack/plugin-async-pack` 插件配合使用，单独使用时无法发挥其核心功能（解决异步样式加载问题）。

当与 `@taro-minify-pack/plugin-async-pack` 插件一起使用时，您无需手动导入此包，插件会自动将所有 `React.lazy`
调用转换为使用此增强版实现：

```tsx
// 插件会自动将以下代码转换为使用 @taro-minify-pack/react-lazy-enhanced
import React, {Suspense, lazy} from 'react'

const DynamicComponent = lazy(() => import('./DynamicComponent'))

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DynamicComponent/>
        </Suspense>
    )
}
```


## 📝 工作原理

### 核心作用

由于 `taro-plugin-async-pack` 改造了 webpack 的 dist runtime，异步组件的 JavaScript 和样式文件会被分离到不同的异步分包中。
`@taro-minify-pack/react-lazy-enhanced` 的核心作用是**确保在组件初始化时，异步模块的样式文件已经加载完成**。

### 工作流程

1. **组件初始化**：当组件首次渲染或卸载后重新渲染时
2. **调用工厂函数**：强制调用传入的 factory 函数，触发异步模块和样式的加载
3. **等待加载完成**：通过 Suspense 机制等待模块和样式加载完成
4. **状态管理**：维护加载状态，确保组件在样式就绪后才会渲染
5. **自动重置**：组件卸载时重置加载状态，确保下次渲染时重新确认样式加载

### 与原生 React.lazy 的关键区别

原生 React.lazy 会同时加载 JavaScript 和 CSS 模块。在 Web 环境中：

- JS 模块会被保存在内存中
- CSS 模块通过 `<style>` 标签插入，只需插入一次就会被浏览器缓存

但在 Taro 小程序环境中，由于 `taro-plugin-async-pack` 对 webpack runtime 的改造，异步样式加载机制完全不同：

- 样式文件被单独打包到异步分包中
- 通过向每个页面插入自定义组件的方式实现样式加载
- 每次页面重新加载都需要重新注入样式，无法像 Web 环境那样缓存

这种差异可能导致组件已加载但样式未就绪的问题。`@taro-minify-pack/react-lazy-enhanced` 通过每次组件初始化时重新调用工厂函数的方式，确保异步模块的
JavaScript 和样式文件都能被正确加载并应用到当前页面。

### 关键实现代码

```tsx
export const lazy = <T extends ComponentType<any>>(factory: Factory<T>) => {
    const LazyComponent = React.lazy(factory) as ForwardRefExoticComponent<any>
    const loadData: LoadData<T> = {status: Status.Uninitialized}

    const load = () => {
        if (loadData.status !== Status.Uninitialized) return
        const successCallback = (res: Result<T>) => {
            loadData.status = Status.Resolved
            loadData.result = res.default
        }
        const errorCallback = (err: Error) => {
            loadData.status = Status.Rejected
            loadData.result = err
        }
        // 每次组件初始化都会调用 factory 函数，确保样式加载完成
        loadData.promise = factory().then(successCallback, errorCallback)
        loadData.status = Status.Pending
    }

    const resetLoadData = () => {
        loadData.status = Status.Uninitialized
        loadData.result = undefined
        loadData.promise = undefined
    }

    return React.forwardRef<ComponentRef<T>, ComponentPropsWithoutRef<T>>((props, ref) => {
        if (loadData.status === Status.Uninitialized) load()

        if (loadData.status === Status.Pending) throw loadData.promise

        if (loadData.status === Status.Rejected) throw loadData.result

        useEffect(() => {
            return resetLoadData()
        }, [])

        return <LazyComponent {...props} ref={ref}/>
    })
}
```

## 🆚 与原生 React.lazy 的区别

| 特性                     | React.lazy               | @taro-minify-pack/react-lazy-enhanced |
|------------------------|--------------------------|---------------------------------------|
| **基础懒加载功能**            | ✅ 支持                     | ✅ 支持                                  |
| **模块加载策略**             | 一次加载，缓存复用                | 每次组件初始化都重新调用工厂函数                      |
| **样式加载机制**             | Web：CSS 通过 style 标签插入并缓存 | 小程序：通过自定义组件注入样式，每次页面加载需重新注入           |
| **与 Taro 插件集成**        | ❌ 无特殊集成                  | ✅ 与 `taro-plugin-async-pack` 深度配合     |
| **webpack runtime 适配** | ❌ 无特殊适配                  | ✅ 适配改造后的 webpack runtime              |
| **组件卸载处理**             | ❌ 无特殊处理                  | ✅ 卸载时重置状态                             |
| **使用场景**               | 通用 Web 应用                | Taro 小程序、需要确保样式加载的场景                  |

## ⚠️ 注意事项

1. **与 Suspense 配合使用**：必须将懒加载组件包裹在 `Suspense` 组件中
2. **与 Taro 插件的关系**：此包必须与 `@taro-minify-pack/plugin-async-pack` 插件配合使用，单独使用时无法解决 Taro 小程序环境下的异步样式加载问题
3. **性能考虑**：由于每次组件初始化都会调用工厂函数，可能会增加网络请求。但在小程序环境中，这种额外开销通常是可接受的，且能确保样式正确加载
4. **版本兼容性**：需要 React 16.8+ 版本支持 Hooks
5. **样式配置**：确保 Taro 项目的样式配置正确，特别是在使用异步分包时

## 🔧 API

### `lazy`

**类型**：`<T extends ComponentType<any>>(factory: Factory<T>) => React.LazyExoticComponent<T>`

**描述**：创建一个懒加载组件，确保每次初始化时样式加载完成

**参数**：
- `factory`: 一个返回 Promise 的工厂函数，用于动态加载组件模块

**返回值**：
- 返回一个懒加载组件，需要配合 `Suspense` 组件使用

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

> 该插件是 @taro-minify-pack 系列插件的一部分，致力于提供完整的 Taro 项目优化解决方案。

