import { assign, attribute, builtin, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const aVertexPosition = vec3(attribute("aVertexPosition", 0));
const aTextureCoord = vec2(attribute("aTextureCoord", 1));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 0, 1));

const vPosition = vec4(builtin("position", "position_vec4"));
const vTextureCoord = vec2(varying("vTextureCoord", 0));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const position = var_("position", vec4(aVertexPosition, 1.0));

    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(vTextureCoord, aTextureCoord);
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    // sampler 的 binding 从 2 开始，因为 vertex shader 的 uniform 已经占用了 0 和 1
    const uSampler = sampler("uSampler", 2, 0);

    return_(texture2D(uSampler, vTextureCoord));
});

