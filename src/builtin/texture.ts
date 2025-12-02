import { getBuildParam } from '../buildShader';
import { Sampler } from '../sampler';
import { Vec2 } from './types/vec2';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { Int } from './types/int';

/**
 * texture 函数，用于采样纹理
 * 支持 vec2 坐标（普通纹理）、vec3 坐标（纹理数组）或 vec2 + int（纹理数组）
 * @param sampler 采样器（在 GLSL 中是 sampler2D 或 sampler2DArray，在 WGSL 中需要 texture 和 sampler）
 * @param coord 纹理坐标（vec2 或 vec3）
 * @returns 采样结果（vec4）
 */
export function texture(sampler: Sampler, coord: Vec2 | Vec3): Vec4;
/**
 * texture 函数，用于采样纹理数组
 * @param sampler 采样器
 * @param coord 纹理坐标（vec2）
 * @param layer 纹理数组层索引（int）
 * @returns 采样结果（vec4）
 */
export function texture(sampler: Sampler, coord: Vec2, layer: Int): Vec4;
export function texture(sampler: Sampler, coord: Vec2 | Vec3, layer?: Int): Vec4
{
    const result = new Vec4();
    const isTextureArray = coord instanceof Vec3 || layer !== undefined;

    // 如果使用 Vec3 坐标或 vec2 + int，需要将 sampler 的 GLSL 类型改为 sampler2DArray
    if (isTextureArray)
    {
        sampler.setSamplerType('2DArray');
    }

    result.toGLSL = () =>
    {
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;
        // 在 WebGL 2.0 中，使用 texture 函数
        // 在 WebGL 1.0 中，对于 vec2 坐标使用 texture2D，对于 vec3 坐标或 vec2 + int 使用 texture（纹理数组需要 WebGL 2.0）
        const textureFunc = version === 2 || isTextureArray ? 'texture' : 'texture2D';

        if (layer !== undefined)
        {
            // 纹理数组：vec2 + int -> vec3(coord, float(layer))
            return `${textureFunc}(${sampler.name}, vec3(${coord.toGLSL()}, float(${layer.toGLSL()})))`;
        }
        else if (coord instanceof Vec3)
        {
            // 纹理数组：vec3 坐标
            return `${textureFunc}(${sampler.name}, ${coord.toGLSL()})`;
        }
        else
        {
            // 普通纹理：vec2 坐标
            return `${textureFunc}(${sampler.name}, ${coord.toGLSL()})`;
        }
    };
    // 在 WGSL 中，texture 和 sampler 是分离的
    result.toWGSL = () =>
    {
        if (layer !== undefined)
        {
            // 纹理数组采样：vec2 + int
            return `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL()}, ${layer.toWGSL()})`;
        }
        else if (coord instanceof Vec3)
        {
            // 纹理数组采样：vec3 坐标
            return `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL()})`;
        }
        else
        {
            // 普通纹理采样：vec2 坐标
            return `textureSample(${sampler.name}_texture, ${sampler.name}, ${coord.toWGSL()})`;
        }
    };
    result.dependencies = layer !== undefined ? [sampler, coord, layer] : [sampler, coord];

    return result;
}

