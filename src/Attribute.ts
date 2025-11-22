import { IElement, IType } from './IElement';

/**
 * Attribute 标记
 */
export const ATTRIBUTE_SYMBOL = Symbol('attribute');

/**
 * Attribute 类
 */
export class Attribute implements IElement
{
    readonly __type__ = ATTRIBUTE_SYMBOL;
    dependencies: IElement[];
    readonly name: string;
    value?: IType;
    readonly location?: number;

    constructor(name: string, location?: number)
    {
        this.name = name;
        this.location = location;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value?.glslType;

        return `attribute ${glslType} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码（用于函数参数）
     */
    toWGSL(type: 'vertex' | 'fragment'): string
    {
        const wgslType = this.value?.wgslType;
        const location = this.location !== undefined ? `@location(${this.location})` : '@location(0)';

        return `${location} ${this.name}: ${wgslType}`;
    }

}

/**
 * 定义 attribute 变量
 * 类型通过 vec2()、vec3()、vec4() 等函数自动推断
 * @param name 变量名
 * @param location WGSL location（可选）
 * @returns Attribute 实例
 */
export function attribute(name: string, location?: number): Attribute
{
    return new Attribute(name, location);
}

