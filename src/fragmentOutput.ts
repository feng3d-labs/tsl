import { IElement, ShaderValue } from './IElement';
import { Color } from './builtin/color';
import { Vec4 } from './builtin/types/vec4';

/**
 * FragmentOutput 类
 * 用于在 fragment shader 中定义多个输出（multiple render targets）
 */
export class FragmentOutput<T extends { [key: string]: ShaderValue }> implements IElement
{
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(public readonly fields: T)
    {
        // 初始化所有字段
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            // 验证字段值必须是 Vec4，且依赖项必须是 Color
            if (!(value instanceof Vec4))
            {
                throw new Error(`FragmentOutput 的字段 '${fieldName}' 必须是 Vec4 类型`);
            }

            if (!value.dependencies || value.dependencies.length === 0)
            {
                throw new Error(`FragmentOutput 的字段 '${fieldName}' 没有依赖项`);
            }

            const dep = value.dependencies[0];
            if (!(dep instanceof Color))
            {
                throw new Error(`FragmentOutput 的字段 '${fieldName}' 的依赖项必须是 Color 类型`);
            }

            // 设置字段的 toGLSL 和 toWGSL 方法，返回字段名
            value.toGLSL = () => fieldName;
            value.toWGSL = () => fieldName;

            // 在字段值上添加对 FragmentOutput 的引用，以便依赖分析能找到 FragmentOutput
            (value as any)._fragmentOutput = this;

            // 将字段添加到实例上，使其可以直接访问
            (this as any)[fieldName] = value;
        }

        this.toGLSL = () => ``;
        this.toWGSL = () => ``;
        this.dependencies = Object.values(this.fields);
    }

    /**
     * 生成 GLSL 输出变量声明
     * @returns GLSL 输出变量声明字符串数组
     */
    toGLSLDefinitions(): string[]
    {
        const declarations: string[] = [];

        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0] as Color;
            declarations.push(`layout(location = ${dep.location}) out vec4 ${fieldName};`);
        }

        return declarations;
    }

    /**
     * 生成 WGSL 输出类型定义
     * @returns WGSL 输出类型字符串（多个 @location 输出）
     */
    toWGSLReturnType(): string
    {
        const outputs: string[] = [];

        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0] as Color;
            outputs.push(`@location(${dep.location}) ${fieldName}: vec4<f32>`);
        }

        return `(${outputs.join(', ')})`;
    }
}

/**
 * 创建 FragmentOutput 实例
 * 用于在 fragment shader 中定义多个输出（multiple render targets）
 * @param fields 输出字段，每个字段必须是 vec4(color(location)) 的形式
 * @returns FragmentOutput 实例，可以直接访问字段
 */
export function fragmentOutput<T extends { [key: string]: ShaderValue }>(fields: T): FragmentOutput<T> & T
{
    return new FragmentOutput(fields) as FragmentOutput<T> & T;
}

