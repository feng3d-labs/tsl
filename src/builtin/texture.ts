import { getBuildParam } from '../buildShader';
import { Sampler } from '../sampler';
import { Sampler2DArray } from '../sampler2DArray';
import { Float } from './types/float';
import { Vec2 } from './types/vec2';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { Int } from './types/int';

/**
 * 深度纹理采样结果类型
 * 继承 Vec4 但覆盖 .r 属性，因为 textureLoad 对 texture_depth_2d 返回 f32
 */
class DepthTextureResult extends Vec4
{
    private _depthWgslExpr: () => string;

    constructor()
    {
        super();
    }

    setDepthWgslExpr(expr: () => string): void
    {
        this._depthWgslExpr = expr;
    }

    /**
     * 覆盖 .r 属性
     * 对于深度纹理，textureLoad 返回 f32，不需要 .r 后缀
     */
    get r(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.r`;
        // 在 WGSL 中，textureLoad 对 texture_depth_2d 返回 f32，不需要 .r
        float.toWGSL = this._depthWgslExpr;
        float.dependencies = [this];

        return float;
    }
}

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
    const isTextureArray = sampler instanceof Sampler2DArray;
    const isDepthTexture = sampler.isDepthTexture();

    // 根据是否是深度纹理创建不同的结果类型
    const result = isDepthTexture ? new DepthTextureResult() : new Vec4();

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
            // 普通纹理：vec2 坐标（包括深度纹理，GLSL 中深度纹理也使用 texture() 函数）
            return `${textureFunc}(${sampler.name}, ${coord.toGLSL()})`;
        }
    };

    // 深度纹理的 WGSL 表达式生成函数
    const depthWgslExpr = () =>
    {
        // 深度纹理采样：使用 textureLoad
        // 需要将 UV 坐标转换为像素坐标
        // 生成：textureLoad(name_texture, vec2<i32>(coord * vec2<f32>(textureDimensions(name_texture))), 0)
        const texName = `${sampler.name}_texture`;

        return `textureLoad(${texName}, vec2<i32>(${coord.toWGSL()} * vec2<f32>(textureDimensions(${texName}))), 0)`;
    };

    // 如果是深度纹理结果，设置深度表达式
    if (result instanceof DepthTextureResult)
    {
        result.setDepthWgslExpr(depthWgslExpr);
    }

    // 在 WGSL 中，texture 和 sampler 是分离的
    result.toWGSL = () =>
    {
        // 深度纹理需要使用 textureLoad 而不是 textureSample
        if (isDepthTexture)
        {
            return depthWgslExpr();
        }
        else if (layer !== undefined)
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

