# 仓库中观察到的风格

## 稳定基线

- package 级别的 ESLint 以 `standard` 和 `plugin:@typescript-eslint/recommended` 为基础。
- 多数 package 明确放宽了 `no-explicit-any`、`no-var-requires`、`no-non-null-assertion`、`ban-ts-comment`、`no-unused-vars`、`no-use-before-define`。
- example 应用主要依赖 Taro preset 和 `.editorconfig` 的 2 空格缩进约定。
- 仓库没有统一的根级 Prettier 配置，因此格式更依赖邻近文件，而不是全仓统一 formatter。

## 代表性文件

- `packages/taro-plugin-async-pack/src/index.ts`：比较标准的插件入口结构、配置合并方式、webpack-chain 分组修改和早返回写法。
- `packages/taro-plugin-remote-assets/src/index.ts`：偏实用主义的构建 hook 组织、alias 导入和小型 helper 组合。
- `packages/taro-plugin-async-pack/src/utils.ts`：紧凑的导出工具函数、路径判断和正则判断。
- `packages/taro-preset/src/index.ts`：preset 组装方式、布尔或对象配置的兼容处理、精简的插件注册逻辑。
- `example/framework-react/config/index.ts`：较密集的 Taro 配置对象、内联注释和环境配置合并。
- `example/framework-vue/src/pages/index/index.vue`：以行为演示优先的示例代码，格式纪律相对宽松。

## 建议保留的特征

- package 源码区域保持整洁、可预测，即便 example 更粗糙一些也不要被带偏。
- 注释保持稀疏且有明确目的。
- 插件代码要容易扫读：imports、defaults/constants、default export 清晰分层，只有在 Taro API 要求时才进入多层回调。
- 入口文件里涉及公共使用的类型导出要保留可见性。

## 不要过度修正

- 不要为了统一引号或 import 空格就重写整个文件。
- 不要把过度严格的类型强行塞进本来就偏集成型、偏实用主义的代码里。
- 不要把 example 里的每一个格式不一致都视为 package 代码需要复制的风格。
