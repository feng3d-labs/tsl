import { IElement } from './IElement';

/**
 * Sampler 类，表示纹理采样器
 */
export class Sampler implements IElement
{
    dependencies: IElement[] = [];

    readonly name: string;
    readonly binding?: number;
    readonly group?: number;
    private _autoBinding?: number; // 自动分配的 binding
    private _samplerType?: '2D' | '2DArray'; // sampler 类型：2D 或 2DArray

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
     * @param type sampler 类型：'2D' 或 '2DArray'
     */
    setSamplerType(type: '2D' | '2DArray'): void
    {
        this._samplerType = type;
    }

    /**
     * 获取 sampler 类型
     * @returns sampler 类型：'2D' 或 '2DArray'，如果未设置则返回 undefined
     */
    getSamplerType(): '2D' | '2DArray' | undefined
    {
        return this._samplerType;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
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

        return `${textureBinding} var ${this.name}_texture: texture_2d<f32>;\n${samplerBinding} var ${this.name}: sampler;`;
    }
}

/**
 * 定义 sampler 变量
 * @param name 变量名
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Sampler 实例
 */
export function sampler(name: string, group?: number, binding?: number): Sampler
{
    return new Sampler(name, group, binding);
}

