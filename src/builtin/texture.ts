import { getBuildParam } from '../buildShader';
import { Sampler } from '../Sampler';
import { Vec2 } from './types/vec2';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';

/**
 * texture 函数，用于采样纹理
 * 支持 vec2 坐标（普通纹理）和 vec3 坐标（纹理数组）
 * @param sampler 采样器（在 GLSL 中是 sampler2D 或 sampler2DArray，在 WGSL 中需要 texture 和 sampler）
 * @param coord 纹理坐标（vec2 或 vec3）
 * @returns 采样结果（vec4）
 */
export function texture(sampler: Sampler, coord: Vec2 | Vec3): Vec4
{
    const result = new Vec4();
    // 如果使用 Vec3 坐标，需要将 sampler 的 GLSL 类型改为 sampler2DArray
    if (coord instanceof Vec3)
    {
        sampler.setSamplerType('2DArray');
    }

    result.toGLSL = () =>
    {
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;
        // 在 WebGL 2.0 中，使用 texture 函数
        // 在 WebGL 1.0 中，对于 vec2 坐标使用 texture2D，对于 vec3 坐标使用 texture（纹理数组需要 WebGL 2.0）
        const isVec3 = coord instanceof Vec3;
        const textureFunc = version === 2 || isVec3 ? 'texture' : 'texture2D';

        return `${textureFunc}(${sampler.name}, ${coord.toGLSL()})`;
    };
    // 在 WGSL 中，texture 和 sampler 是分离的
    // 对于 vec3 坐标，使用 textureSampleLevel 或 textureSample（取决于是否需要 mipmap）
    result.toWGSL = () =>
    {
        if (coord instanceof Vec3)
        {
            // 纹理数组采样
            return `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL()})`;
        }
        else
        {
            // 普通纹理采样
            return `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL()})`;
        }
    };
    result.dependencies = [sampler, coord];

    return result;
}

