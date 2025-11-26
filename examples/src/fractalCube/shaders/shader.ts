import { assign, attribute, builtin, float, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec3(attribute('aVertexPosition'));
const aTextureCoord = vec2(attribute('aTextureCoord'));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform('uModelViewMatrix', 0, 0));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix', 0, 1));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct('VertexOutput', {
    vPosition: vec4(builtin('position')),
    vTextureCoord: vec2(varying()),
    vFragPosition: vec4(varying()),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 1.0));

    assign(v.vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(v.vTextureCoord, aTextureCoord);
    const fragPos = var_('fragPos', float(0.5).multiply(vec4(aVertexPosition, 1.0).add(vec4(1.0))));
    assign(v.vFragPosition, fragPos);
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    // sampler 的 binding 会自动分配
    const uSampler = sampler('uSampler');

    const color = var_('color', texture2D(uSampler, v.vTextureCoord).multiply(v.vFragPosition));
    return_(color);
});

