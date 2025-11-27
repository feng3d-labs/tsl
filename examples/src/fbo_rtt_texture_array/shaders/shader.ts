import { assign, attribute, builtin, float, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// ============================================================================
// Layer Shader (用于从纹理数组读取并渲染到屏幕)
// 根据 vertex-layer.glsl 和 fragment-layer.glsl 生成，保持风格一致
// ============================================================================

// Vertex shader 的 attributes
// 对应 GLSL: layout(location = POSITION_LOCATION) in vec2 position;
// 对应 GLSL: layout(location = TEXCOORD_LOCATION) in vec2 textureCoordinates;
const position = vec2(attribute('position'));
const textureCoordinates = vec2(attribute('textureCoordinates'));

// Vertex shader 的 uniforms
// 对应 GLSL: uniform mat4 mvp;
const mvp = mat4(uniform('mvp'));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
// 对应 GLSL: out vec2 v_st;
const vLayer = varyingStruct({
    vPosition: vec4(builtin('position')),
    v_st: vec2(varying()),
});

// Layer Vertex shader 入口函数
// 对应 GLSL: v_st = textureCoordinates; gl_Position = mvp * vec4(position, 0.0, 1.0);
export const layerVertexShader = vertex('main', () =>
{
    assign(vLayer.v_st, textureCoordinates);
    assign(vLayer.vPosition, mvp.multiply(vec4(position, 0.0, 1.0)));
});

// Layer Fragment shader 入口函数
// 对应 GLSL: uniform sampler2DArray diffuse; uniform int layer;
// 注意：TSL 当前不支持 sampler2DArray，这里使用 sampler2D 作为占位
// 实际使用时需要扩展 TSL 以支持纹理数组
const diffuse = sampler('diffuse');
const layer = uniform('layer');

// 对应 GLSL: color = texture(diffuse, vec3(v_st, float(layer)));
export const layerFragmentShader = fragment('main', () =>
{
    // 注意：texture2DArray 功能需要扩展 TSL 来支持
    // 当前实现使用 texture2D 作为占位
    // 实际 WGSL 代码需要手动修改为 textureLoad 或 textureSampleLevel 来访问纹理数组
    // 对应 GLSL: float(layer) - 将 int 转换为 float
    // 注意：layer 是 int uniform，需要转换为 float
    // 在 GLSL 中使用 float(layer)，在 TSL 中需要先将 layer 包装为 float
    // 由于 TSL 当前不支持 int uniform 和 texture2DArray，这里使用 texture2D 作为占位
    // 实际使用时需要扩展 TSL 以支持：
    // 1. int uniform 类型
    // 2. sampler2DArray 类型
    // 3. texture2DArray 函数
    // 临时使用 texture2D，实际应该使用 texture2DArray(diffuse, vec3(v_st, float(layer)))
    return_(texture2D(diffuse, vLayer.v_st));
});

// ============================================================================
// Multiple Output Shader (用于渲染到多个颜色附件)
// 根据 vertex-multiple-output.glsl 和 fragment-multiple-output.glsl 生成，保持风格一致
// ============================================================================

// Multiple Output Vertex shader
// 对应 GLSL: gl_Position = mvp * vec4(position, 0.0, 1.0);
const vMultipleOutput = varyingStruct({
    vPosition: vec4(builtin('position')),
});

export const multipleOutputVertexShader = vertex('main', () =>
{
    assign(vMultipleOutput.vPosition, mvp.multiply(vec4(position, 0.0, 1.0)));
});

// Multiple Output Fragment shader
// 对应 GLSL: 
//   layout(location = 0) out vec4 red;
//   layout(location = 1) out vec4 green;
//   layout(location = 2) out vec4 blue;
//   red = vec4(0.5, 0.0, 0.0, 1.0);
//   green = vec4(0.0, 0.3, 0.0, 1.0);
//   blue = vec4(0.0, 0.0, 0.8, 1.0);
// 注意：TSL 当前不支持多个输出（multiple render targets）
// 这里使用单个输出作为占位，实际使用时需要扩展 TSL
export const multipleOutputFragmentShader = fragment('main', () =>
{
    // 注意：多个输出需要扩展 TSL 来支持
    // 当前实现只返回一个颜色
    // 实际 WGSL 代码需要返回多个 @location 的输出
    // 对应 GLSL 的值：
    const red = var_('red', vec4(0.5, 0.0, 0.0, 1.0));
    const green = var_('green', vec4(0.0, 0.3, 0.0, 1.0));
    const blue = var_('blue', vec4(0.0, 0.0, 0.8, 1.0));
    
    // 当前只返回一个颜色，实际应该返回多个
    return_(red);
});

