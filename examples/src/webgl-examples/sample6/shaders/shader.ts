import { attribute, fragment, gl_FragColor, gl_Position, mat4, sampler2D, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec3(attribute('aVertexPosition'));
const aTextureCoord = vec2(attribute('aTextureCoord'));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

// Varying 变量
const vTextureCoord = vec2(varying('vTextureCoord'));

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = var_('position', vec4(aVertexPosition, 1.0));

    gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    vTextureCoord.assign(aTextureCoord);
});

// sampler（group 缺省时使用默认值 0）
const uSampler = sampler2D(uniform('uSampler'));

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    gl_FragColor.assign(texture2D(uSampler, vTextureCoord));
});
