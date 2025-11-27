import { getBuildParam } from './buildParam';
import { IElement, ShaderValue } from './IElement';

/**
 * Attribute 类
 */
export class Attribute implements IElement
{
    dependencies: IElement[];
    readonly name: string;
    value?: ShaderValue;
    readonly location?: number;
    private _autoLocation?: number; // 自动分配的 location

    constructor(name: string, location?: number)
    {
        this.name = name;
        this.location = location;
    }

    /**
     * 设置自动分配的 location（内部使用）
     */
    setAutoLocation(location: number): void
    {
        this._autoLocation = location;
    }

    /**
     * 获取实际使用的 location（优先使用显式指定的，否则使用自动分配的）
     */
    getEffectiveLocation(): number
    {
        return this.location !== undefined ? this.location : (this._autoLocation ?? 0);
    }

    /**
     * 转换为 GLSL 代码
     * @param type 着色器类型
     */
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value?.glslType;
        const effectiveLocation = this.getEffectiveLocation();
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;

        if (version === 2)
        {
            return `layout(location = ${effectiveLocation}) in ${glslType} ${this.name};`;
        }
        else
        {
            return `attribute ${glslType} ${this.name};`;
        }
    }

    /**
     * 转换为 WGSL 代码（用于函数参数）
     */
    toWGSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value?.wgslType;
        const effectiveLocation = this.getEffectiveLocation();
        const location = `@location(${effectiveLocation})`;

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

