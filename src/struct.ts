import { IElement, ShaderValue } from './IElement';
import { Uniform } from './uniform';
import { Array } from './array';

/**
 * 结构体成员类型
 */
export type StructMemberType = {
    glslType: string;
    wgslType: string;
} | Array<any>;

/**
 * 结构体成员定义
 */
export type StructMembers = Record<string, StructMemberType>;

/**
 * 结构体定义
 */
export class StructDefinition<T extends StructMembers>
{
    readonly name: string;
    readonly members: T;

    constructor(name: string, members: T)
    {
        this.name = name;
        this.members = members;
    }

    /**
     * 生成 GLSL 结构体声明（用于 UBO）
     */
    toGLSLBlock(instanceName: string): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            if (type instanceof Array)
            {
                return `    ${type.glslType} ${name}[${type.length}];`;
            }

            return `    ${type.glslType} ${name};`;
        });

        return `layout(std140, column_major) uniform;\nuniform ${this.name}\n{\n${memberLines.join('\n')}\n} ${instanceName};`;
    }

    /**
     * 生成 WGSL 结构体声明
     */
    toWGSLStruct(): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            if (type instanceof Array)
            {
                return `    ${name}: array<${type.wgslType}, ${type.length}>`;
            }

            return `    ${name}: ${type.wgslType}`;
        });

        return `struct ${this.name}Data\n{\n${memberLines.join(',\n')}\n}`;
    }

    /**
     * 生成 WGSL uniform 声明
     */
    toWGSLUniform(uniformName: string, group: number, binding: number): string
    {
        return `@group(${group}) @binding(${binding}) var<uniform> ${this.name}: ${this.name}Data;`;
    }
}

/**
 * 结构体实例类 - 包含所有成员的访问
 */
export class Struct<T extends StructMembers>
{
    readonly _uniform: Uniform;
    readonly _structDef: StructDefinition<T>;

    // 动态成员通过索引签名访问
    [key: string]: any;

    constructor(uniformVar: Uniform, definition: StructDefinition<T>)
    {
        this._uniform = uniformVar;
        this._structDef = definition;

        const instanceName = uniformVar.name;

        // 为每个成员创建访问器
        for (const [memberName, memberType] of Object.entries(definition.members))
        {
            if (memberType instanceof Array)
            {
                // 创建新的 Array 实例并设置访问路径
                const arrayInstance = new Array(memberType.elementType, memberType.length);
                arrayInstance._setAccessPath(instanceName, definition.name, memberName);
                this[memberName] = arrayInstance;
            }
            else
            {
                this[memberName] = this._createMemberValue(
                    instanceName,
                    definition.name,
                    memberName,
                    memberType
                );
            }
        }

        // 设置 uniform 的 value 为特殊的结构体类型
        uniformVar.value = {
            glslType: definition.name,
            wgslType: `${definition.name}Data`,
            toGLSL: () => instanceName,
            toWGSL: () => definition.name,
            dependencies: [],
            _isStruct: true,
            _structDef: definition,
            _instanceName: instanceName,
        } as any;
    }

    /**
     * 创建简单的 ShaderValue 成员
     */
    private _createMemberValue(parentGLSL: string, parentWGSL: string, memberName: string, memberType: StructMemberType): ShaderValue
    {
        return {
            glslType: memberType.glslType,
            wgslType: memberType.wgslType,
            dependencies: [] as IElement[],
            toGLSL: () => `${parentGLSL}.${memberName}`,
            toWGSL: () => `${parentWGSL}.${memberName}`,
        };
    }
}

/**
 * 结构体构造函数类型
 */
export type StructConstructor<T extends StructMembers> = {
    (uniform: Uniform): T;
    readonly _definition: StructDefinition<T>;
};

/**
 * 创建结构体定义
 * @param name 结构体名称
 * @param members 成员定义
 * @returns 结构体构造函数
 */
export function struct<T extends StructMembers>(name: string, members: T): StructConstructor<T>
{
    const definition = new StructDefinition(name, members);

    // 创建结构体构造函数
    const constructor = ((uniformVar: Uniform): T =>
    {
        return new Struct<T>(uniformVar, definition) as unknown as T;
    }) as StructConstructor<T>;

    // 添加定义属性
    (constructor as any)._definition = definition;

    return constructor;
}
