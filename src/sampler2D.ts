import { Sampler } from './sampler';

/**
 * Sampler2D 类，表示 2D 纹理采样器
 */
export class Sampler2D extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_2d<f32>';
    }
}

/**
 * 定义 sampler2D 变量（2D 纹理采样器）
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler2D 实例
 */
export function sampler2D(name: string, group?: number, binding?: number): Sampler2D
{
    return new Sampler2D(name, group, binding);
}
