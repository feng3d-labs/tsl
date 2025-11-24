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
    private _autoBinding?: number; // 自动分配的 binding

    constructor(name: string, group?: number, binding?: number)
    {
        this.name = name;
        this.group = group;
        this.binding = binding;
    }

    /**
     * 设置自动分配的 binding（内部使用）
     */
    setAutoBinding(binding: number): void
    {
        this._autoBinding = binding;
    }

    /**
     * 获取实际使用的 binding（优先使用显式指定的，否则使用自动分配的）
     */
    getEffectiveBinding(): number | undefined
    {
        return this.binding !== undefined ? this.binding : this._autoBinding;
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
        const effectiveBinding = this.getEffectiveBinding();
        const binding = effectiveBinding !== undefined ? `@binding(${effectiveBinding})` : '';
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
 * @param group WGSL 绑定组（可选）
 * @param binding WGSL 绑定位置（可选）
 * @returns Uniform 实例
 */
export function uniform(name: string, group?: number, binding?: number): Uniform
{
    return new Uniform(name, group, binding);
}

