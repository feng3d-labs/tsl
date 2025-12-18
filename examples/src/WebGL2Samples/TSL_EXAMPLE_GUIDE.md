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

从 `draw_instanced/index.html` 或 `draw_primitive_restart/index.html` 复制模板，修改以下内容：

- `<title>` 标签内容
- `.title` 标题文本
- `.description` 描述示例功能
- `关于示例` 列表说明具体功能点
- canvas 的 `aspect-ratio`（根据需要调整，正方形用 `1 / 1`，宽屏用 `16 / 9`）

### 步骤 2: 创建 `shaders/shader.ts` (TSL 着色器)

分析原始示例的着色器代码，使用 TSL API 实现。常用 API：

```typescript
import { 
    assign,           // 赋值操作
    attribute,        // 顶点属性
    builtin,          // 内置变量
    float, vec2, vec4, // 类型
    fragment,         // 片段着色器
    precision,        // 精度声明
    return_,          // 返回语句
    varying,          // varying 变量
    varyingStruct,    // varying 结构体
    vertex,           // 顶点着色器
} from '@feng3d/tsl';
```

**示例模板：**

```typescript
import { assign, attribute, builtin, fragment, precision, return_, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const pos = vec2(attribute('pos', 0));

const v = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
});

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    assign(v.gl_Position, vec4(pos, 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(vec4(1.0, 0.5, 0.0, 1.0));
});
```

### 步骤 3: 创建 GLSL 着色器文件

**`shaders/vertex.glsl`：**

```glsl
#version 300 es
#define POSITION_LOCATION 0

precision highp float;
precision highp int;

layout(location = POSITION_LOCATION) in vec2 pos;

void main()
{
    gl_Position = vec4(pos, 0.0, 1.0);
}
```

**`shaders/fragment.glsl`：**

```glsl
#version 300 es
precision highp float;
precision highp int;

out vec4 color;

void main()
{
    color = vec4(1.0, 0.5, 0.0, 1.0);
}
```

### 步骤 4: 创建 WGSL 着色器文件

**`shaders/vertex.wgsl`：**

```wgsl
struct VertexInput {
    @location(0) pos: vec2<f32>
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.pos, 0.0, 1.0);
    return output;
}
```

**`shaders/fragment.wgsl`：**

```wgsl
@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.5, 0.0, 1.0);
}
```

### 步骤 5: 创建 `index.ts` (主入口)

**标准模板：**

```typescript
import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入TSL着色器
import { vertexShader, fragmentShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 顶点数据
    const vertexPosBuffer = new Float32Array([
        // ... 顶点坐标
    ]);

    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            glsl: vertexGlsl,
            wgsl: vertexWgsl,
        },
        fragment: {
            glsl: fragmentGlsl,
            wgsl: fragmentWgsl,
            targets: [{ blend: {} }],
        },
        primitive: { topology: 'triangle-list' }, // 或 'triangle-strip'
    };

    // 顶点属性
    const vertexArray: { vertices?: VertexAttributes } = {
        vertices: {
            pos: { data: vertexPosBuffer, format: 'float32x2' },
        },
    };

    // 渲染对象
    const renderObject: RenderObject = {
        bindingResources: {},
        vertices: vertexArray.vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 3, instanceCount: 1 },
        pipeline: program,
    };

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: {
                        colorAttachments: [{
                            clearValue: [0.0, 0.0, 0.0, 1.0],
                            loadOp: 'clear',
                        }],
                    },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

    // 执行渲染
    webgpu.submit(submit);
    webgl.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
```

### 步骤 6: 更新配置文件

在 `resources/files.json` 的 `WebGL2Samples` 数组中添加新示例路径：

```json
{
    "WebGL2Samples": [
        "WebGL2Samples/draw_image_space",
        "WebGL2Samples/draw_instanced",
        "WebGL2Samples/draw_primitive_restart",
        "WebGL2Samples/<新示例名>",
        "WebGL2Samples/fbo_rtt_texture_array",
        "WebGL2Samples/buffer_copy"
    ]
}
```

同时更新 `public/files.json`（如有需要）。

## 着色器语法对照表

| GLSL | WGSL | TSL |
|------|------|-----|
| `in vec2 pos` | `@location(0) pos: vec2<f32>` | `vec2(attribute('pos', 0))` |
| `in vec3 color` | `@location(1) color: vec3<f32>` | `vec3(attribute('color', 1))` |
| `gl_Position` | `@builtin(position)` | `builtin('gl_Position')` |
| `gl_InstanceID` | `@builtin(instance_index)` | `builtin('gl_InstanceID')` |
| `gl_VertexID` | `@builtin(vertex_index)` | `builtin('gl_VertexID')` |
| `out vec4 color` | `-> @location(0) vec4<f32>` | `return_(vec4(...))` |
| `flat out/in` | `@interpolate(flat)` | 在 varying 中配置 |
| `uniform mat4 mvp` | `@group(0) @binding(0)` | `uniform('mvp', ...)` |

## 常用绘制模式

| 模式 | topology | draw 类型 |
|------|----------|-----------|
| 三角形列表 | `'triangle-list'` | `DrawVertex` |
| 三角形条带 | `'triangle-strip'` | `DrawVertex` |
| 索引绘制 | 任意 | `DrawIndexed` |
| 实例化绘制 | 任意 | 设置 `instanceCount > 1` |

## 调试技巧

### 切换到原始着色器

注释掉 TSL 生成代码块，直接使用导入的原始着色器：

```typescript
// 注释掉以下代码，使用导入的原始着色器进行调试
// const vertexGlsl = vertexShader.toGLSL(2);
// const fragmentGlsl = fragmentShader.toGLSL(2);
// const vertexWgsl = vertexShader.toWGSL();
// const fragmentWgsl = fragmentShader.toWGSL(vertexShader);
```

### 查看生成的着色器代码

```typescript
console.log('Vertex GLSL:', vertexShader.toGLSL(2));
console.log('Fragment GLSL:', fragmentShader.toGLSL(2));
console.log('Vertex WGSL:', vertexShader.toWGSL());
console.log('Fragment WGSL:', fragmentShader.toWGSL(vertexShader));
```

## 参考示例

- `draw_instanced/` - 实例化绘制示例
- `draw_primitive_restart/` - 图元重启示例
- `draw_image_space/` - 图像空间绘制示例
- `buffer_copy/` - 缓冲区复制示例
- `fbo_rtt_texture_array/` - 纹理数组 RTT 示例

