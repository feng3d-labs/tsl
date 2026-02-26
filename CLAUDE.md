# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`@feng3d/tsl` 是 feng3d 引擎的着色器语言库，让开发者能够使用 TypeScript 的类型系统和语法来编写 GPU 着色器代码，并生成 WebGPU 的 WGSL 着色器代码。

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式（运行示例）
npm run dev

# 构建
npm run build

# 类型检查
npm run types

# 运行测试
npm run test

# 监听模式测试
npm run test:watch

# 代码检查
npm run lint

# 自动修复代码格式
npm run lintfix

# 生成文档
npm run docs

# 清理构建产物
npm run clean
```

## 架构概览

### 项目结构

```
src/
├── control/        # 控制流（if_, return_, select）
├── core/           # 核心功能（buildShader, Statement, analyzeDependencies）
├── glsl/           # GLSL 专有功能（保留用于兼容性）
│   ├── builtin/    # 内置变量
│   ├── derivative/ # 导数函数
│   ├── sampler/    # 采样器类型
│   └── texture/    # 纹理函数
├── math/           # 数学函数
│   ├── common/     # 通用函数
│   ├── exponential/# 指数函数
│   └── trigonometric/# 三角函数
├── shader/         # 着色器入口（vertex, fragment, func, transform）
├── types/          # 类型定义
│   ├── matrix/     # 矩阵类型
│   ├── scalar/     # 标量类型
│   └── vector/     # 向量类型
├── utils/          # 工具函数
├── variables/      # 变量声明（attribute, uniform, varying, let, var, struct, array）
└── vector/         # 向量运算
```

### 核心 API

**变量声明**：`attribute`, `uniform`, `varying`, `let_`, `var_`, `struct`, `array`

**着色器入口**：`vertex`, `fragment`, `func`, `transform`

**类型**：`float`, `int`, `uint`, `bool`, `vec2/3/4`, `ivec2/3/4`, `uvec2/3/4`, `mat2`, `mat4`, `mat4x3`

**数学函数**：`sin`, `cos`, `atan`, `exp`, `log2`, `pow`, `sqrt`, `abs`, `min`, `max`, `clamp`, `mix`, `smoothstep`, `step`

**向量运算**：`dot`, `cross`, `normalize`, `reflect`, `lessThan`

**纹理**：`texture`, `texelFetch`, `textureLod`, `textureGrad`, `textureOffset`, `textureSize`

### 代码生成流程

1. 使用 TSL API 构建着色器 AST
2. 调用 `shader.toWGSL()` 生成 WGSL 代码
3. 将生成的 WGSL 传递给 WebGPU 渲染后端

## 开发约定

### TypeScript 规范

- **严格模式**：项目使用 `strict: true` 的 TypeScript 配置
- **类型导出**：公共 API 必须导出类型定义
- **命名规范**：
  - 函数：小驼峰（camelCase）
  - 类型/接口：帕斯卡（PascalCase）
  - 常量：大写下划线（UPPER_SNAKE_CASE）
- **避免 any**：公共 API 不使用 `any` 类型

### Git 提交规范

- 使用简体中文
- 遵循约定式提交格式：`<类型>(<范围>): <简短描述>`
- 类型：feat/fix/refactor/perf/style/docs/test/chore/build/ci

### 测试规范

- 测试文件与源文件同目录，命名为 `*.test.ts`
- 使用 Vitest 框架
- 公共 API 变更必须添加或更新测试

## 依赖说明

### 运行时依赖

无（纯 TypeScript 库，无运行时依赖）

### 开发依赖

- `typescript` - 类型检查和编译
- `vite` - 构建工具
- `vitest` - 测试框架
- `eslint` - 代码检查
- `typedoc` - 文档生成

## 开发环境准备

**首次打开项目时，Claude Code 必须主动检查以下工具和插件是否已安装。**

### 必需：Superpowers 插件

```bash
claude plugin marketplace add obra/superpowers-marketplace
claude plugin install superpowers@superpowers-marketplace
```

### 推荐：其他插件

| 插件 | 安装命令 | 说明 |
|------|---------|------|
| code-simplifier | `claude plugin install code-simplifier` | 代码简化与重构 |
| typescript-lsp | `claude plugin install typescript-lsp` | TypeScript 语言服务 |
| commit-commands | `claude plugin install commit-commands` | Git 提交工具（`/commit`） |

## 发布流程

1. 更新 `package.json` 中的版本号
2. 运行 `npm run build` 确保构建成功
3. 运行 `npm test` 确保测试通过
4. 运行 `npm publish` 发布到 npm
