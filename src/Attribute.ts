import { convertTypeToWGSL } from './builtin/vec4';
import { getCurrentShaderInstance } from './currentShaderInstance';

/**
 * Attribute 标记
 */
export const ATTRIBUTE_SYMBOL = Symbol('attribute');

/**
 * Attribute 类
 */
export class Attribute
{
    readonly __type__ = ATTRIBUTE_SYMBOL;
    readonly name: string;
    readonly type: string;
    readonly location?: number;

    constructor(name: string, type: string, location?: number)
    {
        this.name = name;
        this.type = type;
        this.location = location;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        return `attribute ${this.type} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码（用于函数参数）
     */
    toWGSL(): string
    {
        const wgslType = convertTypeToWGSL(this.type);
        const location = this.location !== undefined ? `@location(${this.location})` : '@location(0)';
        return `${location} ${this.name}: ${wgslType}`;
    }

    /**
     * 转换为 AttributeConfig
     */
    toConfig(): { name: string; type: string; location?: number }
    {
        return {
            name: this.name,
            type: this.type,
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
 * @param name 变量名
 * @param type 类型：vec2, vec3, vec4, float 等
 * @param location WGSL location（可选）
 * @returns Attribute 实例
 */
export function attribute(name: string, type: string, location?: number): Attribute
{
    const def = new Attribute(name, type, location);

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

