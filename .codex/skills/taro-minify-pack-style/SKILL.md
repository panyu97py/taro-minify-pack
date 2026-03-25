---
name: taro-minify-pack-style
description: taro-minify-pack 仓库的专用代码风格与实现约定。用于编辑或新增本仓库文件时，尤其适用于 packages/*/src 下的插件源码、preset 组装代码、example/* 下的 Taro 示例应用，以及需要保持与仓库现有 TypeScript、Taro、构建插件写法一致的配置文件。
---

# Taro Minify Pack Style

## 快速开始

- 先遵循仓库现有的实用主义写法，再考虑通用“最佳实践”。
- 优先写单一职责的小模块、直接的控制流和尽量收敛的 diff。
- 把格式不一致视为历史遗留，除非任务本身就是清理风格，否则不要顺手全文件重排。
- 需要看具体样例或对新文件做风格校准时，先读 `references/observed-style.md`。

## Package 源码

- package 实现使用 TypeScript，采用 2 空格缩进，通常不写分号。
- 仅类型导入在合适时优先使用 `import type`，让导入意图更清晰。
- 主插件或 preset 工厂通常从 `src/index.ts` 做默认导出。
- 如果调用方需要使用公共配置类型，则从入口文件补充导出对应类型。
- helper 文件保持聚焦，一个文件只处理一个 transform、一组 utilities、一个 adapter 或一组类型。
- 导出的工具函数和插件入口优先用箭头函数。
- 优先早返回，少写层层嵌套。
- 派生配置优先使用浅层对象展开，例如 `finalOpts = { ...defaults, ...pluginOpts }`。
- 注释只在 Taro、webpack 或构建阶段行为不直观时补充，且尽量短。
- 注释可以是中文，但标识符命名保持英文。

## 类型与实用主义

- 保持对 `strict` TypeScript 的意识，但在接 Taro、webpack、Babel、文件系统 API 时沿用仓库当前的实用主义取向。
- 如果更严格的类型只会增加噪音、却不能明显提升插件可维护性，可以接受 `any`、非空断言和相对宽松的配置类型。
- 对外暴露的配置接口保持明确、轻量。
- 插件配置类型在邻近文件也这么写时，优先使用 `Opt` 或 `Opts` 后缀。
- interface、class、插件类名使用 PascalCase，函数和局部变量使用 camelCase。

## 数据处理与工具函数

- 做配置改写、资源映射、路径替换时，优先使用对象展开、`reduce`、`find`、`some` 和小型内联闭包。
- 正则和路径判断逻辑尽量就近放置，跟着使用它的代码走。
- 构建期工具函数优先使用同步 `fs`，除非异步能带来明确收益。
- helper 保持短小、可组合，不要过早引入抽象层。

## Taro 与构建集成

- package 代码按 Node 侧构建工具来写，不按浏览器运行时代码来设计。
- 在插件工厂内部直接使用 `modifyWebpackChain`、`modifyBuildAssets`、`modifyRunnerOpts`、`onBuildStart` 这类 Taro hook。
- 在 webpack-chain 回调中，把相关修改聚在一起，直接使用链式 API。
- alias 用法与本地 tsconfig 保持一致；package 代码里可以依赖 `@/` 指向 `src/*`。
- 维持当前入口文件形态：先 imports，再本地 defaults/constants，最后是默认导出的插件主体。

## Example 与配置文件

- `example/*` 主要承担行为演示作用，不是最严格的格式基准。
- 配置文件保持声明式和相对紧凑：先组织 `baseConfig`，补少量必要注释，最后合并环境配置。
- React 和 Vue 示例优先用最简单的代码把异步加载和插件行为演示清楚。
- 除非任务明确是做风格清理，否则不要把示例里的引号、空格等不一致全部顺手统一。

## 护栏

- 有明确本地配置时优先跟配置走：package 代码以 `standard` + `plugin:@typescript-eslint/recommended` 为基线，example 应用跟随 Taro ESLint preset。
- 遵守 example 里的 `.editorconfig` 默认项：空格缩进、2 空格、UTF-8、去除行尾空白、文件末尾保留换行。
- 编辑现有文件时，除非你正在重构那一段，否则尽量保留邻近代码原有的 import 顺序和空白风格。
- 新文件如果没有足够的邻近参考，默认使用 2 空格、单引号、不写分号、箭头函数、早返回和简短注释。
