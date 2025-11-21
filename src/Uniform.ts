import { Vec2 } from './builtin/vec2';
import { convertTypeToWGSL, Vec4 } from './builtin/vec4';
import { getCurrentShaderInstance } from './currentShaderInstance';
import { IElement } from './IElement';

/**
 * Uniform 标记
 */
export const UNIFORM_SYMBOL = Symbol('uniform');

/**
 * Uniform 类
 */
export class Uniform implements IElement
{
    readonly __type__ = UNIFORM_SYMBOL;

    dependencies: IElement[];

    readonly name: string;
    value?: Vec2 | Vec4;
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
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Uniform '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const type = this.value.glslType;

        return `uniform ${type} ${this.name};`;
    }

    /**
     * 转换为 WGSL 代码
     */
    toWGSL(): string
    {
        const type = this.value?.wgslType;
        const wgslType = convertTypeToWGSL(type);
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
    const def = new Uniform(name, binding, group);

    // 如果当前正在构造 Shader 实例，自动添加到 uniforms 字典
    const currentShaderInstance = getCurrentShaderInstance();
    if (currentShaderInstance && currentShaderInstance.uniforms)
    {
        if (currentShaderInstance.uniforms[name])
        {
            throw new Error(`Uniform '${name}' 已经定义过了，不能重复定义。`);
        }
        currentShaderInstance.uniforms[name] = def;
    }

    return def;
}

