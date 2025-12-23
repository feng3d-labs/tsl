import { Array } from './array';
import { IElement, ShaderValue } from './IElement';
import { Uniform } from './uniform';

/**
 * 类型工厂函数（如 vec4、mat4、array(mat4, 2) 等）
 */
type TypeFactory<T extends ShaderValue = any> = (...args: any[]) => T;

/**
 * 结构体成员类型
 */
export type StructMemberType = TypeFactory;

/**
 * 结构体成员定义
 */
export type StructMembers = Record<string, StructMemberType>;

/**
 * 将成员工厂函数类型映射为其返回值类型
 */
type ResolveMembers<T extends StructMembers> = {
    [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
};

/**
 * 结构体构造函数类型标记
 */
const STRUCT_CONSTRUCTOR_MARKER = Symbol('structConstructor');

/**
 * 结构体构造函数类型
 */
export interface StructConstructor<T extends StructMembers> {
    (uniform: Uniform): ResolveMembers<T>;
    [STRUCT_CONSTRUCTOR_MARKER]: true;
    _definition: StructDefinition<T>;
}

/**
 * 判断是否为结构体构造函数
 */
export function isStructConstructor(fn: unknown): fn is StructConstructor<any>
{
    return typeof fn === 'function' && (fn as any)[STRUCT_CONSTRUCTOR_MARKER] === true;
}

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
     * 生成 GLSL 纯结构体声明（用于嵌套结构体）
     */
    toGLSLStruct(): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${type._definition.name} ${name};`;
            }

            const instance = type();
            if (instance instanceof Array)
            {
                return `    ${instance.glslType} ${name}[${instance.length}];`;
            }

            return `    ${instance.glslType} ${name};`;
        });

        return `struct ${this.name}\n{\n${memberLines.join('\n')}\n};`;
    }

    /**
     * 生成 GLSL 结构体声明（用于 UBO）
     */
    toGLSLBlock(instanceName: string): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${type._definition.name} ${name};`;
            }

            const instance = type();
            if (instance instanceof Array)
            {
                return `    ${instance.glslType} ${name}[${instance.length}];`;
            }

            return `    ${instance.glslType} ${name};`;
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
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${name}: ${type._definition.name}`;
            }

            const instance = type();
            if (instance instanceof Array)
            {
                return `    ${name}: array<${instance.wgslType}, ${instance.length}>`;
            }

            return `    ${name}: ${instance.wgslType}`;
        });

        return `struct ${this.name}\n{\n${memberLines.join(',\n')}\n}`;
    }

    /**
     * 生成 WGSL uniform 声明
     */
    toWGSLUniform(instanceName: string, group: number, binding: number): string
    {
        return `@group(${group}) @binding(${binding}) var<uniform> ${instanceName}: ${this.name};`;
    }

    /**
     * 获取所有嵌套的结构体定义（用于生成完整的声明）
     */
    getNestedStructDefinitions(): StructDefinition<any>[]
    {
        const nested: StructDefinition<any>[] = [];
        for (const type of Object.values(this.members))
        {
            if (isStructConstructor(type))
            {
                // 递归获取嵌套结构体的嵌套结构体
                nested.push(...type._definition.getNestedStructDefinitions());
                nested.push(type._definition);
            }
        }

        return nested;
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

    constructor(uniformVar: Uniform, definition: StructDefinition<T>, parentPath?: string)
    {
        this._uniform = uniformVar;
        this._structDef = definition;

        const instanceName = parentPath ?? uniformVar.name;

        // 为每个成员创建访问器
        for (const [memberName, memberType] of Object.entries(definition.members))
        {
            // 检查是否是函数类型
            if (typeof memberType === 'function')
            {
                // 检查是否是嵌套结构体构造函数
                if (isStructConstructor(memberType))
                {
                    // 嵌套结构体：递归创建成员访问器
                    const nestedPath = `${instanceName}.${memberName}`;
                    const nestedStruct = new Struct(uniformVar, memberType._definition, nestedPath);
                    this[memberName] = nestedStruct;
                    continue;
                }

                const instance = memberType();
                if (instance instanceof Array)
                {
                    // 数组成员
                    instance._setAccessPath(instanceName, instanceName, memberName);
                    // 将 uniform 添加到依赖中，以便依赖分析能够找到结构体定义
                    instance.dependencies = [uniformVar];
                    this[memberName] = instance;
                }
                else
                {
                    // 普通类型函数（如 vec4、mat4）
                    instance.toGLSL = () => `${instanceName}.${memberName}`;
                    instance.toWGSL = () => `${instanceName}.${memberName}`;
                    // 将 uniform 添加到依赖中，以便依赖分析能够找到结构体定义
                    instance.dependencies = [uniformVar];
                    this[memberName] = instance;
                }
                continue;
            }

            // 普通成员（对象类型）
            this[memberName] = this._createMemberValue(
                instanceName,
                memberName,
                memberType as { glslType: string; wgslType: string },
            );
        }

        // 仅在顶层结构体时设置 uniform 的 value
        if (!parentPath)
        {
            uniformVar.value = {
                glslType: definition.name,
                wgslType: definition.name,
                toGLSL: () => instanceName,
                toWGSL: () => instanceName,
                dependencies: [],
                _isStruct: true,
                _structDef: definition,
                _instanceName: instanceName,
            } as any;
        }
    }

    /**
     * 创建简单的 ShaderValue 成员
     */
    private _createMemberValue(instanceName: string, memberName: string, memberType: { glslType: string; wgslType: string }): ShaderValue
    {
        return {
            glslType: memberType.glslType,
            wgslType: memberType.wgslType,
            dependencies: [] as IElement[],
            toGLSL: () => `${instanceName}.${memberName}`,
            toWGSL: () => `${instanceName}.${memberName}`,
        };
    }
}

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
    const constructor = ((uniformVar: Uniform): ResolveMembers<T> =>
    {
        return new Struct<T>(uniformVar, definition) as unknown as ResolveMembers<T>;
    }) as StructConstructor<T>;

    // 标记为结构体构造函数
    constructor[STRUCT_CONSTRUCTOR_MARKER] = true;
    constructor._definition = definition;

    return constructor;
}
