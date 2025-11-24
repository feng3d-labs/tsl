// 注意：由于 TSL 目前不支持 max, normalize, dot 等数学函数，
// 此示例暂时使用 GLSL 和 WGSL 文件（vertex.glsl, fragment.glsl, vertex.wgsl, fragment.wgsl）
// 未来当 TSL 支持这些函数时，可以取消注释下面的代码


import { assign, attribute, builtin, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const aVertexPosition = vec3(attribute("aVertexPosition", 0));
const aVertexNormal = vec3(attribute("aVertexNormal", 1));
const aTextureCoord = vec2(attribute("aTextureCoord", 2));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));
const uNormalMatrix = mat4(uniform("uNormalMatrix", 2, 0));

const vPosition = vec4(builtin("position", "position_vec4"));
const vTextureCoord = vec2(varying("vTextureCoord", 0));
const vLighting = vec3(varying("vLighting", 1));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const position = var_("position", vec4(aVertexPosition, 1.0));

    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(vTextureCoord, aTextureCoord);

    // TODO: 应用光照效果（需要 max, normalize, dot 函数支持）
    // const ambientLight = var_("ambientLight", vec3(0.3, 0.3, 0.3));
    // const directionalLightColor = var_("directionalLightColor", vec3(1.0, 1.0, 1.0));
    // const directionalVector = var_("directionalVector", normalize(vec3(0.85, 0.8, 0.75)));
    // const transformedNormal = var_("transformedNormal", vec4(uNormalMatrix.multiply(vec4(aVertexNormal, 1.0))));
    // const directional = var_("directional", max(dot(transformedNormal.xyz, directionalVector), 0.0));
    // const lighting = var_("lighting", ambientLight.add(directionalLightColor.multiply(directional)));
    // assign(vLighting, lighting);
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    // sampler 的 binding 从 3 开始，因为 vertex shader 的 uniform 已经占用了 0, 1, 2
    const uSampler = sampler("uSampler", 3, 0);

    const texelColor = var_("texelColor", texture2D(uSampler, vTextureCoord));
    // TODO: 应用光照效果（需要访问 vec4 的 rgb 和 a 属性）
    // const finalColor = var_("finalColor", vec4(texelColor.rgb.multiply(vLighting), texelColor.a));
    // return_(finalColor);
    return_(texelColor);
});


