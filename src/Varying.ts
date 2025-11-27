import { IElement, ShaderValue } from './IElement';

/**
 * Varying 类，表示在 vertex 和 fragment shader 之间传递的变量
 *
 * 只能在 varyingStruct 中使用：
 * - 变量名由 varyingStruct 根据字段名自动设置
 * - location 可以显式指定，也可以由 varyingStruct 自动分配
 */
export class Varying implements IElement
{
    dependencies: IElement[] = [];

    /** 变量名称（由 varyingStruct 根据字段名设置） */
    name?: string;

    /** 值类型（由 vec2/vec3/vec4 等函数设置） */
    value?: ShaderValue;

    /** 显式指定的 location */
    readonly location?: number;

    /** 自动分配的 location（由 varyingStruct 设置） */
    private _autoLocation?: number;

    constructor(location?: number)
    {
        this.location = location;
    }

    /**
     * 设置变量名（由 varyingStruct 调用）
     * @internal
     */
    setName(name: string): void
    {
        this.name = name;
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
     */
    toGLSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.name)
        {
            throw new Error(`Varying 没有设置 name，必须在 varyingStruct 中使用。`);
        }
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;

        return `varying ${glslType} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码（用于结构体字段）
     */
    toWGSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.name)
        {
            throw new Error(`Varying 没有设置 name，必须在 varyingStruct 中使用。`);
        }
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value.wgslType;
        const effectiveLocation = this.getEffectiveLocation();
        const location = `@location(${effectiveLocation})`;

        return `${location} ${this.name}: ${wgslType}`;
    }
}

/**
 * 定义 varying 变量
 * 只能在 varyingStruct 中使用，变量名从结构体字段名获取
 * 类型通过 vec2()、vec3()、vec4() 等函数自动推断
 * @param location WGSL location（可选）
 * @returns Varying 实例
 */
export function varying(location?: number): Varying
{
    return new Varying(location);
}

