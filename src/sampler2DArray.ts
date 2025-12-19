import { Sampler } from './sampler';

/**
 * Sampler2DArray 类，表示 2D 纹理数组采样器
 */
export class Sampler2DArray extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2DArray';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_2d_array<f32>';
    }
}

/**
 * 定义 sampler2DArray 变量（2D 纹理数组采样器）
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler2DArray 实例
 */
export function sampler2DArray(name: string, group?: number, binding?: number): Sampler2DArray
{
    return new Sampler2DArray(name, group, binding);
}
