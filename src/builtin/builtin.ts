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

    toGLSL(type: 'vertex' | 'fragment'): string
    {
        // 根据内置变量名称和着色器类型返回对应的 GLSL 变量名
        if (this.builtinName === 'position')
        {
            if (type === 'vertex')
            {
                return 'gl_Position';
            }
            throw `内置变量 ${this.builtinName} 不能用于 fragment shader`;
        }
        throw `内置变量 ${this.builtinName} 不支持 GLSL`;
    }

    toWGSL(type: 'vertex' | 'fragment'): string
    {
        // 返回用户自定义的变量名
        return this.varName;
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

