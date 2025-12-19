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
- **必须包含两个画布**：`<canvas id="webgl">` 和 `<canvas id="webgpu">`

### 步骤 2: 创建着色器文件

1. **`shaders/shader.ts`** - TSL 着色器（核心），参考现有示例
2. **`shaders/vertex.glsl`** 和 **`shaders/fragment.glsl`** - GLSL 着色器（调试用）
3. **`shaders/vertex.wgsl`** 和 **`shaders/fragment.wgsl`** - WGSL 着色器（调试用）

#### WGSL 着色器编写规则（重要）

WGSL 着色器中的 uniform 变量**必须直接声明，不要使用 struct 包装**，以确保与 render-api 的绑定机制兼容：

```wgsl
// ✅ 正确：直接声明 uniform
@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

// ❌ 错误：使用 struct 包装（与 render-api 不兼容）
struct Uniforms { MVP: mat4x4<f32> }
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
```

在着色器中直接使用变量名：
```wgsl
// ✅ 正确
output.position = MVP * vec4<f32>(input.position, 0.0, 1.0);

// ❌ 错误
output.position = uniforms.MVP * vec4<f32>(input.position, 0.0, 1.0);
```

**原因**：render-api 通过 `bindingResources` 中的 key（如 `MVP`）直接绑定 uniform，WGSL 中的变量名必须与之匹配。

#### Texture+Sampler 组合绑定规则

当 `bindingResources` 使用 texture+sampler 组合时（如 `diffuse: { texture, sampler }`），WGSL 中需要使用特定的命名：

```wgsl
// bindingResources: { diffuse: { texture, sampler }, MVP: { value: ... } }

// 顶点着色器
@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

// 片段着色器（binding 索引必须与顶点着色器错开）
@group(0) @binding(1) var diffuse_texture: texture_2d<f32>;  // 纹理：原名 + "_texture"
@group(0) @binding(2) var diffuse: sampler;                   // 采样器：原名
```

**重要**：
- 纹理变量名 = `bindingResources` 中的 key + `_texture`（如 `diffuse_texture`）
- 采样器变量名 = `bindingResources` 中的 key（如 `diffuse`）
- 片段着色器的 `@binding` 索引必须与顶点着色器错开，避免冲突

#### 深度纹理处理规则（重要）

深度纹理在 WebGL 和 WebGPU 中的处理方式不同：

**TSL 着色器中使用 `depthSampler` 替代 `sampler`：**

```typescript
import { depthSampler, texture } from '@feng3d/tsl';

// 使用 depthSampler 声明深度纹理
const depthMap = depthSampler('depthMap');

// 采样深度值（返回 f32，可直接使用或通过 .r 访问）
const depth = texture(depthMap, uv).r;
```

**WGSL 手动着色器中的处理：**

```wgsl
// ✅ 正确：使用 texture_depth_2d 类型
@group(0) @binding(0) var depthMap_texture: texture_depth_2d;
@group(0) @binding(1) var depthMap: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // 使用 textureLoad 而不是 textureSample（深度纹理不支持过滤采样）
    let texSize = textureDimensions(depthMap_texture);
    let texCoord = vec2<i32>(input.v_st * vec2<f32>(texSize));
    let depth = textureLoad(depthMap_texture, texCoord, 0);
    return vec4<f32>(vec3<f32>(1.0 - depth), 1.0);
}
```

**关键区别：**

| 特性 | 普通纹理 | 深度纹理 |
|-----|---------|---------|
| TSL 声明 | `sampler('name')` | `depthSampler('name')` |
| WGSL 类型 | `texture_2d<f32>` | `texture_depth_2d` |
| WGSL 采样 | `textureSample(...)` | `textureLoad(...)` |
| 返回类型 | `vec4<f32>` | `f32` |

**空片段着色器（仅写深度）：**

```typescript
// TSL：不返回任何值即可
export const depthFragmentShader = fragment('main', () => {
    precision('highp', 'float');
    // 不调用 return_()，仅写入深度
});
```

```wgsl
// WGSL：函数不需要返回类型
@fragment
fn main() {
    // 空函数体，仅写入深度
}
```

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

## WebGL 与 WebGPU 双渲染（重要）

**所有示例必须同时支持 WebGL 和 WebGPU 渲染，并自动对比结果**，除非该功能仅某一平台支持（如 `BlitFramebuffer` 仅 WebGL 支持）。

### 标准模板

```typescript
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // ... 创建渲染资源 ...

    // 执行渲染
    webgl.submit(submit);
    webgpu.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
```

### 仅单平台支持的情况

如果功能仅某一平台支持，需要：
1. HTML 中只保留对应平台的画布
2. 在"关于示例"中说明平台限制
3. 代码中添加注释说明原因

示例（仅 WebGL）：
```typescript
// BlitFramebuffer 是 WebGL 特有功能，WebGPU 暂不支持
const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });
webgl.submit(submit);
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
const diffuse = sampler('diffuse');       // 普通纹理：用 sampler
const depth = depthSampler('depthMap');   // 深度纹理：用 depthSampler

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

// 普通纹理采样
texture(diffuse, v.v_st)

// 深度纹理采样（返回 f32）
texture(depthMap, v.v_st).r
```

### 完整示例（带纹理）

```typescript
import { attribute, builtin, fragment, mat4, precision, return_, sampler, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

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
    v.v_st.assign(texcoord);
    v.gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
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
| `sampler('depth')` 用于深度纹理 | `depthSampler('depth')` | 深度纹理需要特殊类型 |
| WGSL 深度纹理用 `textureSample` | 用 `textureLoad` | 深度纹理不支持过滤采样 |
| WGSL 深度纹理用 `texture_2d<f32>` | 用 `texture_depth_2d` | 深度纹理有专用类型 |

## 参考示例

根据功能复杂度选择参考：
- `draw_primitive_restart/` - 基础模板（无纹理，双渲染）
- `draw_range_arrays/` - 视口分割绘制（双渲染）
- `draw_image_space/` - 纹理采样（双渲染）
- `fbo_multisample/` - 多重采样 + 两阶段渲染（双渲染）
- `fbo_rtt_depth_texture/` - 深度纹理渲染（双渲染，深度纹理处理）
- `fbo_blit/` - 仅 WebGL 支持（BlitFramebuffer）
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
