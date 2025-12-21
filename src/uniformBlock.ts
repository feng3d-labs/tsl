import { IElement, ShaderValue } from './IElement';
import { Mat4 } from './builtin/types/mat4';
import { Vec4 } from './builtin/types/vec4';
import { Int } from './builtin/types/int';
import { UInt } from './builtin/types/uint';

/**
 * 数组成员类型
 */
type ArrayElementType = 'mat4' | 'vec4';

/**
 * 数组成员定义
 */
interface ArrayMemberDef
{
    /** 成员名称 */
    name: string;
    /** 元素类型 */
    type: ArrayElementType;
    /** 数组长度 */
    length: number;
}

/**
 * UniformBlock 定义
 */
interface UniformBlockDef
{
    /** 块名称 */
    blockName: string;
    /** 实例名称 */
    instanceName: string;
    /** 数组成员列表 */
    members: ArrayMemberDef[];
    /** WGSL binding 索引（可选） */
    binding?: number;
    /** WGSL group 索引（可选，默认 0） */
    group?: number;
}

/**
 * 数组索引表达式
 */
class ArrayIndex<T extends ShaderValue> implements ShaderValue
{
    readonly glslType: string;
    readonly wgslType: string;
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor(
        private readonly arrayExpr: string,
        private readonly index: Int | UInt | IElement | number,
        private readonly elementType: ArrayElementType,
        private readonly wgslArrayExpr: string
    )
    {
        if (elementType === 'mat4')
        {
            this.glslType = 'mat4';
            this.wgslType = 'mat4x4<f32>';
        }
        else
        {
            this.glslType = 'vec4';
            this.wgslType = 'vec4<f32>';
        }

        this.dependencies = typeof index === 'number' ? [] : [index as IElement];

        this.toGLSL = () =>
        {
            const indexStr = typeof index === 'number' ? `${index}` : (index as IElement).toGLSL();

            return `${arrayExpr}[${indexStr}]`;
        };

        this.toWGSL = () =>
        {
            const indexStr = typeof index === 'number' ? `${index}` : (index as IElement).toWGSL();

            return `${wgslArrayExpr}[${indexStr}]`;
        };
    }
}

/**
 * Mat4 数组成员
 */
class Mat4ArrayMember implements IElement
{
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    constructor(
        private readonly glslExpr: string,
        private readonly wgslExpr: string,
        private readonly length: number
    )
    {
        this.toGLSL = () => glslExpr;
        this.toWGSL = () => wgslExpr;
    }

    /**
     * 数组索引访问
     * @param index 索引（可以是常量、Int、UInt 或任何有 toGLSL/toWGSL 方法的对象）
     */
    index(idx: number | Int | UInt | { toGLSL(): string; toWGSL(): string }): Mat4
    {
        const result = new Mat4();
        const deps: IElement[] = typeof idx === 'number' ? [] : [idx as IElement];

        result.toGLSL = () =>
        {
            const indexStr = typeof idx === 'number' ? `${idx}` : idx.toGLSL();

            return `${this.glslExpr}[${indexStr}]`;
        };
        result.toWGSL = () =>
        {
            const indexStr = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

            return `${this.wgslExpr}[${indexStr}]`;
        };
        result.dependencies = deps;

        return result;
    }
}

/**
 * Vec4 数组成员
 */
class Vec4ArrayMember implements IElement
{
    readonly glslType = 'vec4';
    readonly wgslType = 'vec4<f32>';
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    constructor(
        private readonly glslExpr: string,
        private readonly wgslExpr: string,
        private readonly length: number
    )
    {
        this.toGLSL = () => glslExpr;
        this.toWGSL = () => wgslExpr;
    }

    /**
     * 数组索引访问
     * @param index 索引（可以是常量、Int、UInt 或任何有 toGLSL/toWGSL 方法的对象）
     */
    index(idx: number | Int | UInt | { toGLSL(): string; toWGSL(): string }): Vec4
    {
        const result = new Vec4();
        const deps: IElement[] = typeof idx === 'number' ? [] : [idx as IElement];

        result.toGLSL = () =>
        {
            const indexStr = typeof idx === 'number' ? `${idx}` : idx.toGLSL();

            return `${this.glslExpr}[${indexStr}]`;
        };
        result.toWGSL = () =>
        {
            const indexStr = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

            return `${this.wgslExpr}[${indexStr}]`;
        };
        result.dependencies = deps;

        return result;
    }
}

/**
 * UniformBlock 类
 * 用于定义 UBO（Uniform Buffer Object）
 *
 * @example
 * ```ts
 * const Transform = uniformBlock({
 *     blockName: 'Transform',
 *     instanceName: 'transform',
 *     members: [
 *         { name: 'MVP', type: 'mat4', length: 2 }
 *     ]
 * });
 *
 * // 在着色器中使用
 * const mvp = Transform.MVP.index(gl_InstanceID);
 * gl_Position.assign(mvp.multiply(vec4(pos, 0.0, 1.0)));
 * ```
 */
export class UniformBlock implements IElement
{
    readonly blockName: string;
    readonly instanceName: string;
    readonly members: ArrayMemberDef[];
    readonly binding?: number;
    readonly group: number;

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    // 动态添加的成员访问器
    [key: string]: any;

    constructor(def: UniformBlockDef)
    {
        this.blockName = def.blockName;
        this.instanceName = def.instanceName;
        this.members = def.members;
        this.binding = def.binding;
        this.group = def.group ?? 0;

        // 为每个成员创建访问器
        for (const member of this.members)
        {
            const glslExpr = `${this.instanceName}.${member.name}`;
            const wgslExpr = member.name; // WGSL 中直接使用成员名

            if (member.type === 'mat4')
            {
                this[member.name] = new Mat4ArrayMember(glslExpr, wgslExpr, member.length);
            }
            else if (member.type === 'vec4')
            {
                this[member.name] = new Vec4ArrayMember(glslExpr, wgslExpr, member.length);
            }
        }

        this.toGLSL = () => this.blockName;
        this.toWGSL = () => this.blockName;
    }

    /**
     * 生成 GLSL uniform block 声明
     */
    toGLSLDeclaration(): string
    {
        const membersStr = this.members
            .map((m) => `    ${this.getGLSLType(m.type)} ${m.name}[${m.length}];`)
            .join('\n');

        return `layout(std140, column_major) uniform;

uniform ${this.blockName}
{
${membersStr}
} ${this.instanceName};`;
    }

    /**
     * 生成 WGSL uniform 声明
     * WGSL 不支持 UBO 结构体包装，需要为每个数组成员生成独立的 uniform
     */
    toWGSLDeclaration(startBinding: number): string
    {
        const declarations: string[] = [];
        let currentBinding = startBinding;

        for (const member of this.members)
        {
            const wgslType = this.getWGSLArrayType(member.type, member.length);
            declarations.push(
                `@group(${this.group}) @binding(${currentBinding}) var<uniform> ${member.name}: ${wgslType};`
            );
            currentBinding++;
        }

        return declarations.join('\n');
    }

    private getGLSLType(type: ArrayElementType): string
    {
        switch (type)
        {
            case 'mat4': return 'mat4';
            case 'vec4': return 'vec4';
            default: return type;
        }
    }

    private getWGSLArrayType(type: ArrayElementType, length: number): string
    {
        switch (type)
        {
            case 'mat4': return `array<mat4x4<f32>, ${length}>`;
            case 'vec4': return `array<vec4<f32>, ${length}>`;
            default: return `array<${type}, ${length}>`;
        }
    }
}

/**
 * 创建 UniformBlock
 *
 * @example
 * ```ts
 * // 定义 Transform UBO
 * const Transform = uniformBlock({
 *     blockName: 'Transform',
 *     instanceName: 'transform',
 *     members: [
 *         { name: 'MVP', type: 'mat4', length: 2 }
 *     ]
 * });
 *
 * // 定义 Material UBO
 * const Material = uniformBlock({
 *     blockName: 'Material',
 *     instanceName: 'material',
 *     members: [
 *         { name: 'Diffuse', type: 'vec4', length: 2 }
 *     ]
 * });
 * ```
 */
export function uniformBlock(def: UniformBlockDef): UniformBlock
{
    return new UniformBlock(def);
}

export { Mat4ArrayMember, Vec4ArrayMember };
