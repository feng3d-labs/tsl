import { assign, attribute, builtin, dot, fragment, mat4, max, normalize, return_, sampler, texture2D, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec4(attribute("aVertexPosition"));
const aVertexNormal = vec3(attribute("aVertexNormal"));
const aTextureCoord = vec2(attribute("aTextureCoord"));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 0, 1));
const uNormalMatrix = mat4(uniform("uNormalMatrix", 0, 2));

const vPosition = vec4(builtin("position", "position_vec4"));
// varyings（location 缺省时自动分配）
const vTextureCoord = vec2(varying("vTextureCoord"));
const vLighting = vec3(varying("vLighting"));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(aVertexPosition));
    assign(vTextureCoord, aTextureCoord);

    // 应用光照效果
    const ambientLight = var_("ambientLight", vec3(0.3, 0.3, 0.3));
    const directionalLightColor = var_("directionalLightColor", vec3(1.0, 1.0, 1.0));
    const directionalVector = var_("directionalVector", normalize(vec3(0.85, 0.8, 0.75)));
    const transformedNormal = var_("transformedNormal", uNormalMatrix.multiply(vec4(aVertexNormal, 1.0)));
    const directional = var_("directional", max(dot(transformedNormal.xyz, directionalVector), 0.0));
    const lighting = var_("lighting", ambientLight.add(directionalLightColor.multiply(directional)));
    assign(vLighting, lighting);
});

// sampler 的 binding 会自动分配，因为 vertex shader 的 uniform 已经占用了 0, 1, 2（group 缺省时使用默认值 0）
const uSampler = sampler("uSampler");

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    const texelColor = var_("texelColor", texture2D(uSampler, vTextureCoord));
    // 应用光照效果
    return_(vec4(texelColor.rgb.multiply(vLighting), texelColor.a));
});


