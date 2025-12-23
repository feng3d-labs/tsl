import { Sampler } from '../sampler';
import { IVec2 } from './types/ivec2';
import { Int } from './types/int';
import { Uvec4 } from './types/uvec4';
import { Vec4 } from './types/vec4';

/**
 * texelFetch 函数，通过整数像素坐标直接获取纹理中的单个纹素
 * 与 texture() 不同，texelFetch 不进行任何过滤，直接返回指定像素的颜色值
 *
 * @param sampler 纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（默认 0）
 * @returns 纹素颜色（vec4）
 */
export function texelFetch(sampler: Sampler, coord: IVec2, lod?: Int | number): Vec4
{
    const result = new Vec4();

    const lodValue = lod ?? 0;
    const lodGLSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toGLSL();
    const lodWGSL = typeof lodValue === 'number' ? `${lodValue}u` : `u32(${lodValue.toWGSL()})`;

    // GLSL: texelFetch(sampler2D, ivec2, int)
    // WGSL: textureLoad(texture, vec2<i32>, u32)
    result.toGLSL = () => `texelFetch(${sampler.uniform.name}, ${coord.toGLSL()}, ${lodGLSL})`;
    result.toWGSL = () => `textureLoad(${sampler.uniform.name}_texture, ${coord.toWGSL()}, ${lodWGSL})`;
    result.dependencies = typeof lodValue === 'number' ? [sampler, coord] : [sampler, coord, lodValue];

    return result;
}

/**
 * utexelFetch 函数，通过整数像素坐标直接获取无符号整数纹理中的单个纹素
 * 用于 usampler2D（如 rgba8uint 格式的纹理）
 *
 * @param sampler 无符号整数纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（默认 0）
 * @returns 纹素颜色（uvec4）
 */
export function utexelFetch(sampler: Sampler, coord: IVec2, lod?: Int | number): Uvec4
{
    const result = new (Uvec4 as any)();

    const lodValue = lod ?? 0;
    const lodGLSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toGLSL();
    const lodWGSL = typeof lodValue === 'number' ? `${lodValue}u` : `u32(${lodValue.toWGSL()})`;

    // GLSL: texelFetch(usampler2D, ivec2, int) -> uvec4
    // WGSL: textureLoad(texture_2d<u32>, vec2<i32>, u32) -> vec4<u32>
    result.toGLSL = () => `texelFetch(${sampler.uniform.name}, ${coord.toGLSL()}, ${lodGLSL})`;
    result.toWGSL = () => `textureLoad(${sampler.uniform.name}_texture, ${coord.toWGSL()}, ${lodWGSL})`;
    result.dependencies = typeof lodValue === 'number' ? [sampler, coord] : [sampler, coord, lodValue];

    return result;
}

