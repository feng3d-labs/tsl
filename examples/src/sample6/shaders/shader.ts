import { assign, attribute, builtin, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec3(attribute('aVertexPosition'));
const aTextureCoord = vec2(attribute('aTextureCoord'));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct('VertexOutput', {
    vPosition: vec4(builtin('position')),
    vTextureCoord: vec2(varying()),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 1.0));

    assign(v.vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(v.vTextureCoord, aTextureCoord);
});

// sampler（group 缺省时使用默认值 0）
const uSampler = sampler('uSampler');

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(texture2D(uSampler, v.vTextureCoord));
});

