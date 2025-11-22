import { IElement } from '../IElement';
import { formatNumber } from './formatNumber';

/**
 * 类型映射：GLSL 类型到 WGSL 类型
 */
const typeMap: Record<string, string> = {
    float: 'f32',
    int: 'i32',
    uint: 'u32',
    bool: 'bool',
    vec2: 'vec2<f32>',
    vec3: 'vec3<f32>',
    vec4: 'vec4<f32>',
    ivec2: 'vec2<i32>',
    ivec3: 'vec3<i32>',
    ivec4: 'vec4<i32>',
    uvec2: 'vec2<u32>',
    uvec3: 'vec3<u32>',
    uvec4: 'vec4<u32>',
    bvec2: 'vec2<bool>',
    bvec3: 'vec3<bool>',
    bvec4: 'vec4<bool>',
    mat2: 'mat2x2<f32>',
    mat3: 'mat3x3<f32>',
    mat4: 'mat4x4<f32>',
};

/**
 * 将 GLSL 类型转换为 WGSL 类型
 */
export function convertTypeToWGSL(glslType: string): string
{
    return typeMap[glslType] || glslType;
}
