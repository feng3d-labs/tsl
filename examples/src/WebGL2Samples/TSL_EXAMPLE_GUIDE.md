# TSL 示例实现标准指南

本文档定义了在 `packages/tsl/examples/src/WebGL2Samples/` 目录下创建新 TSL 示例的标准流程。

## 目录结构

```
packages/tsl/examples/src/WebGL2Samples/<示例名>/
├── index.html          # HTML 入口页面
├── index.ts            # TypeScript 主入口
└── shaders/
    ├── shader.ts       # TSL 着色器代码（核心）
    ├── vertex.glsl     # GLSL 顶点着色器（调试用）
    ├── fragment.glsl   # GLSL 片段着色器（调试用）
    ├── vertex.wgsl     # WGSL 顶点着色器（调试用）
    └── fragment.wgsl   # WGSL 片段着色器（调试用）
```

## 实现步骤

### 步骤 1: 创建 `index.html`

从现有示例（如 `draw_primitive_restart/index.html`）复制模板，修改：
- `<title>` 和 `.title` 标题
- `.description` 描述
- `关于示例` 列表

### 步骤 2: 创建着色器文件

1. **`shaders/shader.ts`** - TSL 着色器（核心），参考 `draw_primitive_restart/shaders/shader.ts`
2. **`shaders/vertex.glsl`** 和 **`shaders/fragment.glsl`** - GLSL 着色器（调试用）
3. **`shaders/vertex.wgsl`** 和 **`shaders/fragment.wgsl`** - WGSL 着色器（调试用）

### 步骤 3: 创建 `index.ts`

参考 `draw_primitive_restart/index.ts`，关键代码结构：

```typescript
// 导入原始着色器（调试用）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 生成着色器代码（变量名必须与导入的相同，便于调试切换）
const vertexGlsl = vertexShader.toGLSL(2);
const fragmentGlsl = fragmentShader.toGLSL(2);
const vertexWgsl = vertexShader.toWGSL();
const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

### 步骤 4: 更新配置文件

在 `resources/files.json` 和 `public/files.json` 的 `WebGL2Samples` 数组中添加新示例路径。

## 着色器语法对照表

| GLSL | WGSL | TSL |
|------|------|-----|
| `in vec2 pos` | `@location(0) pos: vec2<f32>` | `vec2(attribute('pos', 0))` |
| `gl_Position` | `@builtin(position)` | `builtin('gl_Position')` |
| `gl_InstanceID` | `@builtin(instance_index)` | `builtin('gl_InstanceID')` |
| `gl_VertexID` | `@builtin(vertex_index)` | `builtin('gl_VertexID')` |
| `out vec4 color` | `-> @location(0) vec4<f32>` | `return_(vec4(...))` |
| `flat out/in` | `@interpolate(flat)` | 在 varying 中配置 |

## 调试技巧

注释掉 TSL 生成代码，即可切换到原始着色器调试：

```typescript
// const vertexGlsl = vertexShader.toGLSL(2);
// const fragmentGlsl = fragmentShader.toGLSL(2);
// const vertexWgsl = vertexShader.toWGSL();
// const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

**重要**：导入的着色器变量名必须与 TSL 生成的变量名相同，这样才能通过简单注释切换。

## 参考示例

- `draw_primitive_restart/` - 基础模板（推荐）
- `draw_range_arrays/` - 视口分割绘制
- `draw_instanced/` - 实例化绘制
- `draw_image_space/` - 图像空间绘制
