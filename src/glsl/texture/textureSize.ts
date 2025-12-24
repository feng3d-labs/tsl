import { Sampler } from '../sampler/sampler';
import { IVec2 } from '../../types/vector/ivec2';
import { Int } from '../../types/scalar/int';

/**
 * textureSize 函数，获取纹理的尺寸
 * @param sampler 纹理采样器
 * @param lod mip 级别（默认 0）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler, lod?: Int | number): IVec2
{
    const result = new (IVec2 as any)();

    const lodValue = lod ?? 0;
    const lodGLSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toGLSL();
    // WGSL 的 textureDimensions 返回 vec2<u32>，需要转换为 vec2<i32>
    const lodWGSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toWGSL();

    result.toGLSL = () => `textureSize(${sampler.uniform.name}, ${lodGLSL})`;
    result.toWGSL = () => `vec2<i32>(textureDimensions(${sampler.uniform.name}_texture, ${lodWGSL}))`;
    result.dependencies = typeof lodValue === 'number' ? [sampler] : [sampler, lodValue];

    return result;
}

