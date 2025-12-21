import { Array } from './array';
import { IElement, ShaderValue } from './IElement';
import { Uniform } from './uniform';

/**
 * 数组工厂函数类型
 */
type ArrayFactory<T extends ShaderValue = any> = () => Array<T>;

/**
 * 结构体成员类型
 */
export type StructMemberType = {
    glslType: string;
    wgslType: string;
} | ArrayFactory;

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
            const arrayInstance = this._getArrayInstance(type);
            if (arrayInstance)
            {
                return `    ${arrayInstance.glslType} ${name}[${arrayInstance.length}];`;
            }

            return `    ${(type as any).glslType} ${name};`;
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
            const arrayInstance = this._getArrayInstance(type);
            if (arrayInstance)
            {
                return `    ${name}: array<${arrayInstance.wgslType}, ${arrayInstance.length}>`;
            }

            return `    ${name}: ${(type as any).wgslType}`;
        });

        return `struct ${this.name}Data\n{\n${memberLines.join(',\n')}\n}`;
    }

    /**
     * 检查成员类型是否是数组工厂函数，并返回数组实例
     */
    private _getArrayInstance(type: StructMemberType): Array<any> | null
    {
        if (typeof type === 'function')
        {
            const instance = type();
            if (instance instanceof Array)
            {
                return instance;
            }
        }

        return null;
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
            // 检查是否是数组工厂函数
            if (typeof memberType === 'function')
            {
                const arrayInstance = memberType();
                if (arrayInstance instanceof Array)
                {
                    arrayInstance._setAccessPath(instanceName, definition.name, memberName);
                    this[memberName] = arrayInstance;
                    continue;
                }
            }

            // 普通成员
            this[memberName] = this._createMemberValue(
                instanceName,
                definition.name,
                memberName,
                memberType as { glslType: string; wgslType: string },
            );
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
    private _createMemberValue(parentGLSL: string, parentWGSL: string, memberName: string, memberType: { glslType: string; wgslType: string }): ShaderValue
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
 * 创建结构体定义
 * @param name 结构体名称
 * @param members 成员定义
 * @returns 结构体构造函数
 */
export function struct<T extends StructMembers>(name: string, members: T): (uniform: Uniform) => (Struct<T> & T)
{
    const definition = new StructDefinition(name, members);

    // 创建结构体构造函数
    const constructor = ((uniformVar: Uniform): (Struct<T> & T) =>
    {
        return new Struct<T>(uniformVar, definition) as unknown as (Struct<T> & T);
    }) as (uniform: Uniform) => (Struct<T> & T);

    return constructor;
}
