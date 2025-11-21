import { convertTypeToWGSL, FunctionCallConfig } from './builtin/vec4';
import { getCurrentShaderInstance } from './currentShaderInstance';
import { IElement } from './IElement';

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
    value?: FunctionCallConfig; // 保存 vec2() 等函数返回的 FunctionCallConfig
    readonly location?: number;

    constructor(name: string, location?: number)
    {
        this.name = name;
        this.location = location;
    }

    /**
     * 从 value 中提取类型
     */
    private getType(): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法确定类型。请使用 vec2(attribute(...)) 等形式定义。`);
        }

        return this.value.function;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        const type = this.getType();

        return `attribute ${type} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码（用于函数参数）
     */
    toWGSL(): string
    {
        const type = this.getType();
        const wgslType = convertTypeToWGSL(type);
        const location = this.location !== undefined ? `@location(${this.location})` : '@location(0)';

        return `${location} ${this.name}: ${wgslType}`;
    }

    /**
     * 转换为 AttributeConfig
     */
    toConfig(): { name: string; type: string; location?: number }
    {
        const type = this.getType();

        return {
            name: this.name,
            type,
            location: this.location,
        };
    }

    /**
     * 转换为字符串时返回变量名
     */
    toString(): string
    {
        return this.name;
    }

    /**
     * 转换为原始值时返回变量名
     */
    valueOf(): string
    {
        return this.name;
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
    const def = new Attribute(name, location);

    // 如果当前正在构造 Shader 实例，自动添加到 attributes 字典
    const currentShaderInstance = getCurrentShaderInstance();
    if (currentShaderInstance && currentShaderInstance.attributes)
    {
        if (currentShaderInstance.attributes[name])
        {
            throw new Error(`Attribute '${name}' 已经定义过了，不能重复定义。`);
        }
        currentShaderInstance.attributes[name] = def;
    }

    return def;
}

