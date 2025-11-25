import { assign, attribute, builtin, float, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec3(attribute("aVertexPosition"));
const aTextureCoord = vec2(attribute("aTextureCoord"));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 0, 1));

const vPosition = vec4(builtin("position", "position_vec4"));
// varyings（location 缺省时自动分配）
const vTextureCoord = vec2(varying("vTextureCoord"));
const vFragPosition = vec4(varying("v_fragPosition"));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const position = var_("position", vec4(aVertexPosition, 1.0));

    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(vTextureCoord, aTextureCoord);
    const fragPos = var_("fragPos", float(0.5).multiply(vec4(aVertexPosition, 1.0).add(vec4(1.0, 1.0, 1.0, 1.0))));
    assign(vFragPosition, fragPos);
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    // sampler 的 binding 会自动分配
    const uSampler = sampler("uSampler");

    const color = var_("color", texture2D(uSampler, vTextureCoord).multiply(vFragPosition));
    return_(color);
});

