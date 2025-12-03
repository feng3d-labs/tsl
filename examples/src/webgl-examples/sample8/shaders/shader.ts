import { assign, attribute, builtin, dot, fragment, mat4, max, normalize, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec4(attribute('aVertexPosition'));
const aVertexNormal = vec3(attribute('aVertexNormal'));
const aTextureCoord = vec2(attribute('aTextureCoord'));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform('uModelViewMatrix', 0, 0));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix', 0, 1));
const uNormalMatrix = mat4(uniform('uNormalMatrix', 0, 2));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct({
    vPosition: vec4(builtin('position')),
    vTextureCoord: vec2(varying()),
    vLighting: vec3(varying()),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    assign(v.vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(aVertexPosition));
    assign(v.vTextureCoord, aTextureCoord);

    // 应用光照效果
    const ambientLight = var_('ambientLight', vec3(0.3));
    const directionalLightColor = var_('directionalLightColor', vec3(1.0));
    const directionalVector = var_('directionalVector', normalize(vec3(0.85, 0.8, 0.75)));
    const transformedNormal = var_('transformedNormal', uNormalMatrix.multiply(vec4(aVertexNormal, 1.0)));
    const directional = var_('directional', max(dot(transformedNormal.xyz, directionalVector), 0.0));
    const lighting = var_('lighting', ambientLight.add(directionalLightColor.multiply(directional)));
    assign(v.vLighting, lighting);
});

// sampler 的 binding 会自动分配，因为 vertex shader 的 uniform 已经占用了 0, 1, 2（group 缺省时使用默认值 0）
const uSampler = sampler('uSampler');

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    const texelColor = var_('texelColor', texture2D(uSampler, v.vTextureCoord));
    return_(vec4(texelColor.rgb.multiply(v.vLighting), texelColor.a));
});

