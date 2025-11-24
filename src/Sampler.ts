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

    constructor(name: string, group?: number, binding?: number)
    {
        this.name = name;
        this.group = group;
        this.binding = binding;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(type: 'vertex' | 'fragment'): string
    {
        return `uniform sampler2D ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码
     * 在 WGSL 中，texture 和 sampler 是分离的，需要分别声明
     */
    toWGSL(type: 'vertex' | 'fragment'): string
    {
        const binding = this.binding !== undefined ? this.binding : 0;
        const group = this.group !== undefined ? this.group : 0;
        // 在 WGSL 中，texture 和 sampler 需要分别声明
        // texture 在 binding，sampler 在 binding+1
        const textureBinding = `@binding(${binding}) @group(${group})`;
        const samplerBinding = `@binding(${binding + 1}) @group(${group})`;

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

