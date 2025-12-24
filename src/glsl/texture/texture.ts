import { getBuildParam } from '../../core/buildShader';
import { Sampler } from '../sampler/sampler';
import { Sampler2DArray } from '../sampler/sampler2DArray';
import { Sampler3D } from '../sampler/sampler3D';
import { USampler2D } from '../sampler/usampler2D';
import { Float } from '../../types/scalar/float';
import { Uvec4 } from '../../types/vector/uvec4';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';
import { Int } from '../../types/scalar/int';

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
 * texture 函数，用于采样无符号整数纹理（usampler2D）
 * 在 GLSL 中使用 texture() 函数，返回 uvec4
 * 在 WGSL 中使用 textureLoad()，因为整数纹理不支持过滤采样
 * @param sampler 采样器（usampler2D）
 * @param coord 纹理坐标（vec2）
 * @returns 采样结果（uvec4）
 */
export function texture(sampler: USampler2D, coord: Vec2): Uvec4;
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
/**
 * texture 函数（带 LOD bias），用于采样纹理并指定 LOD 偏移
 * @param sampler 采样器（在 GLSL 中是 sampler2D，在 WGSL 中需要 texture 和 sampler）
 * @param coord 纹理坐标（vec2）
 * @param bias LOD 偏移值（float）
 * @returns 采样结果（vec4）
 */
export function texture(sampler: Sampler, coord: Vec2, bias: Float | number): Vec4;
export function texture(sampler: Sampler, coord: Vec2 | Vec3, layerOrBias?: Int | Float | number): Vec4 | Uvec4
{
    // 检测是否是无符号整数纹理
    const isUintTexture = sampler instanceof USampler2D;
    if (isUintTexture && coord instanceof Vec2 && layerOrBias === undefined)
    {
        const result = new Uvec4();

        // GLSL: texture(usampler2D, vec2) -> uvec4
        result.toGLSL = () => `texture(${sampler.uniform.name}, ${coord.toGLSL()})`;

        // WGSL: 整数纹理不支持 textureSample，必须使用 textureLoad
        // 需要将 UV 坐标转换为像素坐标
        result.toWGSL = () =>
        {
            const texName = `${sampler.uniform.name}_texture`;

            return `textureLoad(${texName}, vec2<i32>(${coord.toWGSL()} * vec2<f32>(textureDimensions(${texName}))), 0)`;
        };

        result.dependencies = [sampler, coord];

        return result;
    }

    const isTextureArray = sampler instanceof Sampler2DArray;
    const isTexture3D = sampler instanceof Sampler3D;
    const isDepthTexture = sampler.isDepthTexture();

    // 判断第三个参数的类型
    const isLayer = layerOrBias instanceof Int;
    const isBias = layerOrBias instanceof Float || typeof layerOrBias === 'number';
    const layer = isLayer ? layerOrBias : undefined;
    const bias = isBias ? layerOrBias : undefined;

    // 计算 bias 的 GLSL 和 WGSL 表示
    const biasGLSL = bias !== undefined ? (typeof bias === 'number' ? bias.toFixed(1) : bias.toGLSL()) : undefined;
    const biasWGSL = bias !== undefined ? (typeof bias === 'number' ? bias.toFixed(1) : bias.toWGSL()) : undefined;

    // 根据是否是深度纹理创建不同的结果类型
    const result = isDepthTexture ? new DepthTextureResult() : new Vec4();

    result.toGLSL = () =>
    {
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;
        // 在 WebGL 2.0 中，使用 texture 函数
        // 在 WebGL 1.0 中，对于 vec2 坐标使用 texture2D，对于 vec3 坐标或 vec2 + int 使用 texture（纹理数组和 3D 纹理需要 WebGL 2.0）
        const textureFunc = version === 2 || isTextureArray || isTexture3D ? 'texture' : 'texture2D';

        if (layer !== undefined)
        {
            // 纹理数组：vec2 + int -> vec3(coord, float(layer))
            return `${textureFunc}(${sampler.uniform.name}, vec3(${coord.toGLSL()}, float(${layer.toGLSL()})))`;
        }
        else if (coord instanceof Vec3)
        {
            // 3D 纹理或纹理数组：vec3 坐标
            return `${textureFunc}(${sampler.uniform.name}, ${coord.toGLSL()})`;
        }
        else if (biasGLSL !== undefined)
        {
            // 带 bias 的纹理采样
            return `${textureFunc}(${sampler.uniform.name}, ${coord.toGLSL()}, ${biasGLSL})`;
        }
        else
        {
            // 普通纹理：vec2 坐标（包括深度纹理，GLSL 中深度纹理也使用 texture() 函数）
            return `${textureFunc}(${sampler.uniform.name}, ${coord.toGLSL()})`;
        }
    };

    // 深度纹理的 WGSL 表达式生成函数
    const depthWgslExpr = () =>
    {
        // 深度纹理采样：使用 textureLoad
        // 需要将 UV 坐标转换为像素坐标
        // 生成：textureLoad(name_texture, vec2<i32>(coord * vec2<f32>(textureDimensions(name_texture))), 0)
        const texName = `${sampler.uniform.name}_texture`;

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
            return `textureSample(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${layer.toWGSL()})`;
        }
        else if (coord instanceof Vec3)
        {
            // 3D 纹理或纹理数组采样：vec3 坐标
            return `textureSample(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()})`;
        }
        else if (biasWGSL !== undefined)
        {
            // 带 bias 的纹理采样
            return `textureSampleBias(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${biasWGSL})`;
        }
        else
        {
            // 普通纹理采样：vec2 坐标
            return `textureSample(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()})`;
        }
    };

    // 设置依赖
    if (layer !== undefined)
    {
        result.dependencies = [sampler, coord, layer];
    }
    else if (bias !== undefined && typeof bias !== 'number')
    {
        result.dependencies = [sampler, coord, bias];
    }
    else
    {
        result.dependencies = [sampler, coord];
    }

    return result;
}
