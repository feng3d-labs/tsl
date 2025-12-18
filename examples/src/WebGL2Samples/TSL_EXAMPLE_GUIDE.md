# TSL 示例实现标准指南

本文档定义了在 `packages/tsl/examples/src/WebGL2Samples/` 目录下创建新 TSL 示例的标准流程。

## 目录结构

```
packages/tsl/examples/src/WebGL2Samples/<示例名>/
├── index.html          # HTML 入口页面
├── index.ts            # TypeScript 主入口
├── images/             # 图片资源（如需要）
│   └── *.png
└── shaders/
    ├── shader.ts       # TSL 着色器代码（核心）
    ├── vertex.glsl     # GLSL 顶点着色器（调试用）
    ├── fragment.glsl   # GLSL 片段着色器（调试用）
    ├── vertex.wgsl     # WGSL 顶点着色器（调试用）
    └── fragment.wgsl   # WGSL 片段着色器（调试用）
```

**资源文件规则**：图片等资源文件必须复制到示例目录内（如 `images/`），使用相对路径引用（如 `./images/xxx.png`），不要引用外部路径。

## 实现步骤

### 步骤 1: 创建 `index.html`

从现有示例（如 `draw_primitive_restart/index.html`）复制模板，修改：
- `<title>` 和 `.title` 标题
- `.description` 描述
- `关于示例` 列表

### 步骤 2: 创建着色器文件

1. **`shaders/shader.ts`** - TSL 着色器（核心），参考现有示例
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

### 步骤 5: 编译验证

完成所有文件创建后，必须运行编译命令验证代码正确性：

```bash
npm run build
```

如果有编译错误，需要修复后再次编译，直到编译通过。

## TSL API 常用写法

### 基础类型和属性

```typescript
// 属性（attribute）
const position = vec2(attribute('position', 0));  // location 0
const texcoord = vec2(attribute('texcoord', 4));  // location 4

// Uniform
const MVP = mat4(uniform('MVP'));
const diffuse = sampler('diffuse');  // 注意：用 sampler，不是 sampler2D

// Varying（必须用 varyingStruct 包装）
const v = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
    v_st: vec2(varying()),  // varying() 不带参数
});
```

### 运算操作

```typescript
// 矩阵乘法：用 .multiply()，不是 mul()
MVP.multiply(vec4(position, 0.0, 1.0))

// 链式调用
uProjectionMatrix.multiply(uModelViewMatrix).multiply(position)

// 纹理采样
texture(diffuse, v.v_st)
```

### 完整示例（带纹理）

```typescript
import { assign, attribute, builtin, fragment, mat4, precision, return_, sampler, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

const position = vec2(attribute('position', 0));
const texcoord = vec2(attribute('texcoord', 4));
const MVP = mat4(uniform('MVP'));

const v = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
    v_st: vec2(varying()),
});

export const vertexShader = vertex('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');
    assign(v.v_st, texcoord);
    assign(v.gl_Position, MVP.multiply(vec4(position, 0.0, 1.0)));
});

const diffuse = sampler('diffuse');

export const fragmentShader = fragment('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');
    return_(texture(diffuse, v.v_st));
});
```

## 常见错误

| 错误写法 | 正确写法 | 说明 |
|---------|---------|------|
| `mul(a, b)` | `a.multiply(b)` | 矩阵/向量乘法 |
| `sampler2D('name')` | `sampler('name')` | 纹理采样器 |
| `varying('name')` | `varyingStruct({ name: vec2(varying()) })` | varying 变量 |

## 参考示例

根据功能复杂度选择参考：
- `draw_primitive_restart/` - 基础模板（无纹理）
- `draw_range_arrays/` - 视口分割绘制
- `draw_image_space/` - 纹理采样
- `fbo_blit/` - 纹理 + MVP 矩阵变换
- `webgl-examples/sample5/` - 完整 MVP 变换

## 调试技巧

注释掉 TSL 生成代码，即可切换到原始着色器调试：

```typescript
// const vertexGlsl = vertexShader.toGLSL(2);
// const fragmentGlsl = fragmentShader.toGLSL(2);
// const vertexWgsl = vertexShader.toWGSL();
// const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

**重要**：导入的着色器变量名必须与 TSL 生成的变量名相同，这样才能通过简单注释切换。
