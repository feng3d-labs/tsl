import { IType } from '../IElement';

/**
 * Builtin 类，表示内置变量（如 position）
 */
export class Builtin implements IType
{
    readonly name: string;
    readonly glslType: string;
    readonly wgslType: string;
    dependencies: any[] = [];

    constructor(name: string, glslType: string, wgslType: string)
    {
        this.name = name;
        this.glslType = glslType;
        this.wgslType = wgslType;
    }

    toGLSL(type?: 'vertex' | 'fragment'): string
    {
        // 根据内置变量名称和着色器类型返回对应的 GLSL 变量名
        if (this.name === 'position')
        {
            if (type === 'vertex')
            {
                return 'gl_Position';
            }
            else if (type === 'fragment')
            {
                return 'gl_FragColor';
            }
        }

        return `gl_${this.name}`;
    }

    toWGSL(type?: 'vertex' | 'fragment'): string
    {
        // 在 WGSL 中，内置变量通常作为函数参数或返回值
        // 这里返回变量名，实际使用时会在函数签名中声明
        return this.name;
    }
}

/**
 * 创建内置变量引用
 * @param name 内置变量名称（如 'position'）
 * @returns Builtin 实例
 */
export function builtin(name: string): Builtin
{
    // 根据内置变量名称确定类型
    let glslType = 'vec4';
    let wgslType = 'vec4<f32>';

    if (name === 'position')
    {
        glslType = 'vec4';
        wgslType = 'vec4<f32>';
    }

    return new Builtin(name, glslType, wgslType);
}

