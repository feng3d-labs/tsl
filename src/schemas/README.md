# 着色器配置 JSON Schema

本目录包含用于验证着色器配置 JSON 文件的 JSON Schema 定义。

## 文件说明

- `fragment.schema.json` - Fragment Shader 配置文件的 JSON Schema
- `vertex.schema.json` - Vertex Shader 配置文件的 JSON Schema

## 使用方法

### 1. 在 JSON 文件中引用 Schema

在 `.frag.json` 或 `.vert.json` 文件的开头添加 `$schema` 字段：

```json
{
  "$schema": "../../../../src/schemas/fragment.schema.json",
  "type": "fragment",
  "precision": "highp",
  "uniforms": [
    {
      "name": "color",
      "type": "vec4",
      "binding": 0,
      "group": 0
    }
  ],
  "main": {
    "return": "color"
  }
}
```

### 2. 编辑器支持

支持 JSON Schema 的编辑器（如 VS Code）会自动：
- 提供自动补全
- 进行类型验证
- 显示错误提示
- 显示字段说明

### 3. 类型定义

TypeScript 类型定义位于 `src/types.ts`：
- `FragmentShaderConfig` - Fragment Shader 配置类型
- `VertexShaderConfig` - Vertex Shader 配置类型

导入 JSON 文件时，TypeScript 会自动识别为相应的类型：

```typescript
import fragmentJson from "./shaders/fragment.frag.json";
// fragmentJson 的类型为 FragmentShaderConfig

import vertexJson from "./shaders/vertex.vert.json";
// vertexJson 的类型为 VertexShaderConfig
```

## Schema 规范

### Fragment Shader Schema

- **type**: 必须为 `"fragment"`
- **precision**: 可选，值为 `"lowp"` | `"mediump"` | `"highp"`
- **uniforms**: 可选，统一变量数组
- **attributes**: 可选，属性变量数组（通常不用于 fragment shader）
- **main**: 必需，主函数配置，必须包含 `return` 或 `body` 之一

### Vertex Shader Schema

- **type**: 必须为 `"vertex"`
- **precision**: 可选，值为 `"lowp"` | `"mediump"` | `"highp"`
- **uniforms**: 可选，统一变量数组
- **attributes**: 可选，属性变量数组（用于 vertex shader）
- **main**: 必需，主函数配置，必须包含 `return` 或 `body` 之一

### Uniform 配置

- **name**: 必需，变量名（字符串）
- **type**: 必需，类型（字符串，支持：float, int, uint, bool, vec2/3/4, ivec2/3/4, uvec2/3/4, bvec2/3/4, mat2/3/4, mat2x3/4 等）
- **binding**: 可选，WGSL 绑定位置（整数，>= 0）
- **group**: 可选，WGSL 绑定组（整数，>= 0）

### Attribute 配置

- **name**: 必需，变量名（字符串）
- **type**: 必需，类型（字符串，支持：float, vec2/3/4）
- **location**: 可选，WGSL location（整数，>= 0）

### Main 函数配置

- **return**: 可选，返回值表达式（字符串）
- **body**: 可选，函数体代码（字符串）
- 注意：`return` 和 `body` 至少需要提供一个

## 示例

### Fragment Shader 示例

```json
{
  "$schema": "../../../../src/schemas/fragment.schema.json",
  "type": "fragment",
  "precision": "highp",
  "uniforms": [
    {
      "name": "color",
      "type": "vec4",
      "binding": 0,
      "group": 0
    }
  ],
  "main": {
    "return": "color"
  }
}
```

### Vertex Shader 示例

```json
{
  "$schema": "../../../../src/schemas/vertex.schema.json",
  "type": "vertex",
  "attributes": [
    {
      "name": "position",
      "type": "vec2",
      "location": 0
    }
  ],
  "main": {
    "return": "vec4<f32>(position, 0.0, 1.0)"
  }
}
```

## 验证

JSON Schema 会在以下情况下进行验证：
1. 编辑器自动验证（VS Code 等支持 JSON Schema 的编辑器）
2. 构建时验证（如果集成了 JSON Schema 验证工具）
3. 运行时验证（如果使用了验证库）

## 相关文件

- `src/shaderGenerator.ts` - 着色器代码生成器
- `src/types.ts` - TypeScript 类型定义
- `examples/src/types.d.ts` - 模块类型声明

