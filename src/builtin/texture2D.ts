import { IElement, ShaderValue } from '../IElement';
import { Sampler } from '../Sampler';
import { Vec2 } from './types/vec2';
import { Vec4 } from './types/vec4';

/**
 * texture2D 函数，用于采样纹理
 * @param sampler 采样器（在 GLSL 中是 sampler2D，在 WGSL 中需要 texture 和 sampler）
 * @param coord 纹理坐标（vec2）
 * @returns 采样结果（vec4）
 */
export function texture2D(sampler: Sampler, coord: Vec2): Vec4
{
    const result = new Vec4();
    result.toGLSL = (type: 'vertex' | 'fragment', version?: 1 | 2) => {
        // 如果 version 未指定，默认使用 1（WebGL 1.0）
        // 但在 WebGL 2.0 中，必须使用 texture 而不是 texture2D
        const textureFunc = version === 2 ? 'texture' : 'texture2D';
        const actualVersion = version ?? 1;

        return `${textureFunc}(${sampler.name}, ${coord.toGLSL(type, actualVersion)})`;
    };
    // 在 WGSL 中，texture 和 sampler 是分离的
    result.toWGSL = (type: 'vertex' | 'fragment') => `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL(type)})`;
    result.dependencies = [sampler, coord];

    return result;
}

