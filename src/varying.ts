import { getBuildParam } from './buildShader';
import { IElement, ShaderValue } from './IElement';

/**
 * Varying 类，表示在 vertex 和 fragment shader 之间传递的变量
 *
 * 使用方式：`const v_uv = vec2(varying('v_uv'))`
 *
 * @internal 库外部不应直接使用 `new Varying()`，应使用 `varying()` 函数
 */
export class Varying implements IElement
{
    dependencies: IElement[] = [];

    /** 变量名称 */
    name: string;

    /** 值类型（由 vec2/vec3/vec4 等函数设置） */
    value?: ShaderValue;

    /** 显式指定的 location */
    readonly location?: number;

    /** 自动分配的 location */
    private _autoLocation?: number;

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
     * 转换为 GLSL 代码（用于声明）
     */
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;
        const buildParam = getBuildParam();
        const version = buildParam.version ?? 1;
        const stage = buildParam.stage;

        if (version === 2)
        {
            // WebGL 2.0 中，varyings（顶点到片段的变量）不需要 layout(location)
            // 只需要使用 out（vertex shader）或 in（fragment shader）
            const inOut = stage === 'vertex' ? 'out' : 'in';

            return `${inOut} ${glslType} ${this.name};`;
        }
        else
        {
            return `varying ${glslType} ${this.name};`;
        }
    }

    /**
     * 转换为 WGSL 代码（用于结构体字段定义）
     */
    toWGSL(): string
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

    /**
     * 获取变量名（用于在着色器代码中引用）
     */
    getVarName(): string
    {
        return this.name;
    }
}

/**
 * 定义 varying 变量
 *
 * 使用方式：`const v_uv = vec2(varying('v_uv'))`
 *
 * @param name 变量名称（必需）
 * @param location WGSL location（可选，不指定则自动分配）
 * @returns Varying 实例
 */
export function varying(name: string, location?: number): Varying
{
    return new Varying(name, location);
}

