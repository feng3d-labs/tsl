import { IElement, IType } from '../IElement';

/**
 * Builtin 类，表示内置变量（如 position）
 */
export class Builtin implements IElement
{
    readonly builtinName: string; // WGSL 中内置的固定名称（如 "position"）
    readonly varName: string; // 用户自定义的变量名称（如 "position_vec4"）
    value: IType;
    dependencies: IElement[] = [];

    constructor(builtinName: 'position', varName: string)
    {
        this.builtinName = builtinName;
        this.varName = varName;
    }

    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Builtin '${this.builtinName}' 没有设置 value，无法生成 GLSL。`);
        }
        if (this.builtinName === 'position')
        {
            return 'gl_Position';
        }

        throw ``;
    }

    toWGSL(): string
    {
        const wgslType = this.value?.wgslType;
        if (!wgslType)
        {
            throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置 wgslType，无法生成 WGSL。`);
        }

        return `@builtin(${this.builtinName}) ${this.varName}: ${wgslType}`;
    }
}

/**
 * 创建内置变量引用
 * @param builtinName WGSL 中内置的固定名称（如 'position'）
 * @param varName 用户自定义的变量名称（如 'position_vec4'）
 * @returns Builtin 实例
 */
export function builtin(builtinName: 'position', varName: string): Builtin
{
    return new Builtin(builtinName, varName);
}

