import { IElement, IType } from './IElement';

/**
 * Uniform 类
 */
export class Uniform implements IElement
{
    dependencies: IElement[];

    readonly name: string;
    value?: IType;
    readonly binding?: number;
    readonly group?: number;

    constructor(name: string, binding?: number, group?: number)
    {
        this.name = name;
        this.binding = binding;
        this.group = group;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.value)
        {
            throw new Error(`Uniform '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;

        return `uniform ${glslType} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码
     */
    toWGSL(type: 'vertex' | 'fragment'): string
    {
        if (!this.value)
        {
            throw new Error(`Uniform '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value.wgslType;
        const binding = this.binding !== undefined ? `@binding(${this.binding})` : '';
        const group = this.group !== undefined ? `@group(${this.group})` : '';
        const annotations = [binding, group].filter(Boolean).join(' ');
        const prefix = annotations ? `${annotations} ` : '';

        return `${prefix}var<uniform> ${this.name} : ${wgslType};`;
    }

}

/**
 * 定义 uniform 变量
 * 类型通过 vec4()、vec3()、vec2() 等函数自动推断
 * @param name 变量名
 * @param binding WGSL 绑定位置（可选）
 * @param group WGSL 绑定组（可选）
 * @returns Uniform 实例
 */
export function uniform(name: string, binding?: number, group?: number): Uniform
{
    return new Uniform(name, binding, group);
}

