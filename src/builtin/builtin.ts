import { IElement, ShaderValue } from '../IElement';

/**
 * Builtin 类，表示内置变量（如 position）
 */
export class Builtin implements IElement
{
    readonly builtinName: string; // WGSL 中内置的固定名称（如 "position" 或 "gl_Position"）
    readonly varName: string; // 用户自定义的变量名称（如 "position_vec4"）
    value: ShaderValue;
    dependencies: IElement[] = [];

    constructor(builtinName: 'position' | 'gl_Position', varName: string)
    {
        this.builtinName = builtinName;
        this.varName = varName;
    }

    /**
     * 获取 WGSL 中的 builtin 名称（将 gl_Position 映射为 position）
     */
    get wgslBuiltinName(): string
    {
        return this.builtinName === 'gl_Position' ? 'position' : this.builtinName;
    }

    /**
     * 检查是否是 position 相关的 builtin
     */
    get isPosition(): boolean
    {
        return this.builtinName === 'position' || this.builtinName === 'gl_Position';
    }

    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Builtin '${this.builtinName}' 没有设置 value，无法生成 GLSL。`);
        }
        if (this.isPosition)
        {
            return 'gl_Position';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        const wgslType = this.value?.wgslType;
        if (!wgslType)
        {
            throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置 wgslType，无法生成 WGSL。`);
        }

        return `@builtin(${this.wgslBuiltinName}) ${this.varName}: ${wgslType}`;
    }
}

/**
 * 创建内置变量引用
 * @param builtinName WGSL 中内置的固定名称（如 'position' 或 'gl_Position'，两者等价）
 * @param varName 用户自定义的变量名称（如 'position_vec4'）
 * @returns Builtin 实例
 */
export function builtin(builtinName: 'position' | 'gl_Position', varName: string): Builtin
{
    return new Builtin(builtinName, varName);
}

