import { assign, attribute, builtin, color, float, fragment, fragmentOutput, mat4, return_, sampler, texture, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

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
const layer = float(uniform('layer'));

// 对应 GLSL: color = texture(diffuse, vec3(v_st, float(layer)));
export const layerFragmentShader = fragment('main', () =>
{
    return_(texture(diffuse, vec3(vLayer.v_st, layer)));
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

const f = fragmentOutput({
    red: vec4(color(0)),
    green: vec4(color(1)),
    blue: vec4(color(2)),
});

export const multipleOutputFragmentShader = fragment('main', () =>
{
    assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
    assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
    assign(f.blue, vec4(0.0, 0.0, 0.8, 1.0));
});

