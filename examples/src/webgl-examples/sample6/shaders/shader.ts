import { attribute, builtin, fragment, gl_FragColor, gl_Position, mat4, return_, sampler2D, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec3(attribute('aVertexPosition'));
const aTextureCoord = vec2(attribute('aTextureCoord'));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct({
    vTextureCoord: vec2(varying()),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 1.0));

    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    v.vTextureCoord.assign(aTextureCoord);
});

// sampler（group 缺省时使用默认值 0）
const uSampler = sampler2D('uSampler');

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    gl_FragColor.assign(texture2D(uSampler, v.vTextureCoord));
});

