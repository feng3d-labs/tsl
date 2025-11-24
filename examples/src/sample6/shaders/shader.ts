import { assign, attribute, builtin, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const aVertexPosition = vec3(attribute("aVertexPosition", 0));
const aTextureCoord = vec2(attribute("aTextureCoord", 1));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform("uModelViewMatrix"));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix"));

const vPosition = vec4(builtin("position", "position_vec4"));
const vTextureCoord = vec2(varying("vTextureCoord", 0));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const position = var_("position", vec4(aVertexPosition, 1.0));

    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(vTextureCoord, aTextureCoord);
});

// sampler（group 缺省时使用默认值 0）
const uSampler = sampler("uSampler");

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    return_(texture2D(uSampler, vTextureCoord));
});

