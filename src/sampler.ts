import { IElement } from './IElement';

/**
 * Sampler 抽象基类，表示纹理采样器
 * @internal 库外部不应直接使用，应使用具体子类 Sampler2D、Sampler2DArray 或 DepthSampler
 */
export abstract class Sampler implements IElement
{
    dependencies: IElement[] = [];

    readonly name: string;
    readonly binding?: number;
    readonly group?: number;
    private _autoBinding?: number; // 自动分配的 binding

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
     * 检查是否是深度纹理
     */
    isDepthTexture(): boolean
    {
        return false;
    }

    /**
     * 获取 GLSL 中的 sampler 类型名称
     */
    protected abstract getGLSLSamplerType(): string;

    /**
     * 获取 WGSL 中的 texture 类型名称
     */
    protected abstract getWGSLTextureType(): string;

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        return `uniform ${this.getGLSLSamplerType()} ${this.name};`;
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

        return `${textureBinding} var ${this.name}_texture: ${this.getWGSLTextureType()};\n${samplerBinding} var ${this.name}: sampler;`;
    }
}
