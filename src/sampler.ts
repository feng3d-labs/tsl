import { IElement } from './IElement';

/**
 * Sampler 类，表示纹理采样器
 * @internal 库外部不应直接使用 `new Sampler()`，应使用 `sampler()` 函数
 */
export class Sampler implements IElement
{
    dependencies: IElement[] = [];

    readonly name: string;
    readonly binding?: number;
    readonly group?: number;
    private _autoBinding?: number; // 自动分配的 binding
    private _samplerType?: '2D' | '2DArray' | 'depth'; // sampler 类型：2D、2DArray 或 depth

    constructor(name: string, group?: number, binding?: number)
    {
        this.name = name;
        this.group = group;
        this.binding = binding;
    }

    /**
     * 设置自动分配的 binding（内部使用）
     */
    setAutoBinding(binding: number): void
    {
        this._autoBinding = binding;
    }

    /**
     * 获取实际使用的 binding（优先使用显式指定的，否则使用自动分配的）
     */
    getEffectiveBinding(): number
    {
        return this.binding !== undefined ? this.binding : (this._autoBinding ?? 0);
    }

    /**
     * 获取实际使用的 group（缺省时使用默认值 0）
     */
    getEffectiveGroup(): number
    {
        return this.group ?? 0;
    }

    /**
     * 设置 sampler 类型（内部使用）
     * @param type sampler 类型：'2D'、'2DArray' 或 'depth'
     */
    setSamplerType(type: '2D' | '2DArray' | 'depth'): void
    {
        this._samplerType = type;
    }

    /**
     * 获取 sampler 类型
     * @returns sampler 类型：'2D'、'2DArray' 或 'depth'，如果未设置则返回 undefined
     */
    getSamplerType(): '2D' | '2DArray' | 'depth' | undefined
    {
        return this._samplerType;
    }

    /**
     * 检查是否是深度纹理
     */
    isDepthTexture(): boolean
    {
        return this._samplerType === 'depth';
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        // 深度纹理在 GLSL 中也使用 sampler2D（WebGL2 支持深度纹理采样）
        const samplerType = this._samplerType === '2DArray' ? 'sampler2DArray' : 'sampler2D';

        return `uniform ${samplerType} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码
     * 在 WGSL 中，texture 和 sampler 是分离的，需要分别声明
     */
    toWGSL(): string
    {
        const effectiveBinding = this.getEffectiveBinding();
        const effectiveGroup = this.getEffectiveGroup();
        // 在 WGSL 中，texture 和 sampler 需要分别声明
        // texture 在 binding，sampler 在 binding+1
        const textureBinding = `@binding(${effectiveBinding}) @group(${effectiveGroup})`;
        const samplerBinding = `@binding(${effectiveBinding + 1}) @group(${effectiveGroup})`;

        // 根据 sampler 类型决定使用的纹理类型
        let textureType: string;
        if (this._samplerType === 'depth')
        {
            textureType = 'texture_depth_2d';
        }
        else if (this._samplerType === '2DArray')
        {
            textureType = 'texture_2d_array<f32>';
        }
        else
        {
            textureType = 'texture_2d<f32>';
        }

        return `${textureBinding} var ${this.name}_texture: ${textureType};\n${samplerBinding} var ${this.name}: sampler;`;
    }
}

/**
 * 定义 sampler2D 变量（2D 纹理采样器）
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler 实例
 */
export function sampler2D(name: string, group?: number, binding?: number): Sampler
{
    const s = new Sampler(name, group, binding);
    s.setSamplerType('2D');

    return s;
}

/**
 * 定义 sampler2DArray 变量（2D 纹理数组采样器）
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler 实例（已标记为 2DArray 类型）
 */
export function sampler2DArray(name: string, group?: number, binding?: number): Sampler
{
    const s = new Sampler(name, group, binding);
    s.setSamplerType('2DArray');

    return s;
}

/**
 * 定义深度纹理 sampler 变量
 * 深度纹理在 WGSL 中使用 texture_depth_2d 类型，需要使用 textureLoad 读取
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler 实例（已标记为深度纹理）
 */
export function depthSampler(name: string, group?: number, binding?: number): Sampler
{
    const s = new Sampler(name, group, binding);
    s.setSamplerType('depth');

    return s;
}

