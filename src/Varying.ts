import { IElement, IType } from './IElement';

/**
 * Varying 类，表示在 vertex 和 fragment shader 之间传递的变量
 */
export class Varying implements IElement
{
    dependencies: IElement[] = [];
    readonly name: string;
    value?: IType;
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
     */
    toGLSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;
        // GLSL 中 varying 需要 precision 修饰符（在 fragment shader 中）
        const precision = type === 'fragment' ? ' lowp' : '';

        return `varying${precision} ${glslType} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码（用于结构体字段）
     */
    toWGSL(type: 'vertex' | 'fragment'): string
    {
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
 * 类型通过 vec2()、vec3()、vec4() 等函数自动推断
 * @param name 变量名
 * @param location WGSL location（可选）
 * @returns Varying 实例
 */
export function varying(name: string, location?: number): Varying
{
    return new Varying(name, location);
}

