import { Builtin } from './builtin/builtin';
import { IElement } from './IElement';
import { Varying } from './Varying';

/**
 * VaryingStruct 类
 * 专门用于在顶点和片段着色器之间传递数据
 * 仅支持 Builtin 和 Varying 成员
 */
export class VaryingStruct<T extends { [key: string]: IElement }> implements IElement
{
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;
    readonly structName = 'VaryingStruct';
    private readonly varName = 'v';

    /**
     * 检查结构体是否包含 varying 字段
     */
    hasVarying(): boolean
    {
        return Object.values(this.fields).some(value =>
        {
            if (value.dependencies && value.dependencies.length > 0)
            {
                return value.dependencies[0] instanceof Varying;
            }

            return false;
        });
    }

    /**
     * 生成 GLSL varying 声明
     * @param type 着色器类型（vertex 或 fragment）
     * @returns GLSL varying 声明字符串，例如: 'varying vec4 color; varying vec4 color2;'
     */
    toGLSLDefinition(): string
    {
        const varyingDeclarations: string[] = [];

        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.value)
            {
                const glslType = dep.value.glslType;
                varyingDeclarations.push(`varying ${glslType} ${fieldName}`);
            }
        }

        return varyingDeclarations.length > 0 ? `${varyingDeclarations.join('; ')};` : '';
    }

    /**
     * 生成 WGSL 结构体定义
     * @param type 着色器类型（vertex 或 fragment），可选。varying 字段始终包含 @location
     * @returns WGSL 结构体定义字符串
     */
    toWGSLDefinition(): string
    {
        const fieldDefs = Object.entries(this.fields).map(([fieldName, value]) =>
        {
            const dep = value.dependencies[0];
            if (dep instanceof Builtin)
            {
                // Builtin.toWGSL() 返回格式: @builtin(position) varName: vec4<f32>
                // 我们需要提取 @builtin(...) 和类型，使用结构体字段名
                const builtinWgsl = dep.toWGSL();
                // 提取 @builtin(...) 部分
                const builtinMatch = builtinWgsl.match(/@builtin\([^)]+\)/);
                const builtinPart = builtinMatch ? builtinMatch[0] : '';
                // 提取类型部分（在冒号之后）
                const typeMatch = builtinWgsl.match(/:\s*([^;]+)/);
                const typePart = typeMatch ? typeMatch[1].trim() : dep.value?.wgslType || '';

                return `${builtinPart} ${fieldName}: ${typePart}`;
            }
            else if (dep instanceof Varying)
            {
                if (!dep.value)
                {
                    throw new Error(`Varying '${fieldName}' 没有设置 value，无法生成 WGSL。`);
                }
                const wgslType = dep.value.wgslType;

                // varying 字段始终包含 @location（vertex 输出和 fragment 输入都需要）
                const effectiveLocation = dep.getEffectiveLocation();
                const location = `@location(${effectiveLocation})`;

                return `${location} ${fieldName}: ${wgslType}`;
            }
            else
            {
                throw new Error(`不支持的依赖类型`);
            }
        });
        // 格式化结构体定义，每个字段占一行，使用逗号分隔（所有字段后面都有逗号）
        if (fieldDefs.length === 0)
        {
            return `struct VaryingStruct {}`;
        }
        const formattedFields = fieldDefs.map((field) => `    ${field},`).join('\n');

        return `struct VaryingStruct {\n${formattedFields}\n}`;
    }

    /**
     * 生成顶点着色器中的变量声明语句
     * @returns WGSL 变量声明语句，例如: 'var v: VaryingStruct;'
     */
    toWGSLVarStatement(): string
    {
        return `var ${this.varName}: ${this.structName};`;
    }

    /**
     * 生成片段着色器中的函数参数
     * @returns WGSL 函数参数，例如: 'v: VaryingStruct'
     */
    toWGSLParam(): string
    {
        return `${this.varName}: ${this.structName}`;
    }

    constructor(public readonly fields: T)
    {
        // 验证所有字段都必须是 builtin 或 varying 类型，并设置变量名
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            if (!value.dependencies || value.dependencies.length === 0)
            {
                throw new Error(`结构体 'VaryingStruct' 的字段 '${fieldName}' 没有依赖项，无法生成 WGSL 代码。`);
            }

            const dep = value.dependencies[0];

            if (!(dep instanceof Builtin) && !(dep instanceof Varying))
            {
                throw new Error(`结构体 'VaryingStruct' 的字段 '${fieldName}' 必须是 builtin 或 varying 类型，当前类型不支持。`);
            }

            // 设置变量名为结构体字段名
            if (dep instanceof Builtin)
            {
                dep.setName(fieldName);
            }
            else if (dep instanceof Varying)
            {
                dep.setName(fieldName);
            }

            // 修改字段的 toWGSL 方法，让它返回 'v.fieldName'
            value.toWGSL = (type: 'vertex' | 'fragment') => `${this.varName}.${fieldName}`;

            // 在字段值上添加对 VaryingStruct 的引用，以便依赖分析能找到结构体
            if (!value.dependencies)
            {
                value.dependencies = [];
            }
            // 如果 dependencies 中还没有 VaryingStruct，添加它
            if (!value.dependencies.some(dep => dep === this))
            {
                value.dependencies.push(this);
            }

            // 将字段添加到实例上，使其可以直接访问
            (this as any)[fieldName] = value;
        }

        this.toGLSL = (type: 'vertex' | 'fragment') => ``;
        this.toWGSL = (type: 'vertex' | 'fragment') => this.varName;
        this.dependencies = Object.values(this.fields);
    }
}

/**
 * 创建 VaryingStruct 实例
 * 专门用于在顶点和片段着色器之间传递数据
 * 仅支持 Builtin 和 Varying 成员
 * 结构体名称固定为 VaryingStruct，变量名固定为 v
 * @param fields 结构体字段，每个字段必须是 Builtin 或 Varying 的包装类型（如 vec4(builtin(...)) 或 vec4(varying(...))）
 * @returns VaryingStruct 实例，可以直接访问字段
 */
export function varyingStruct<T extends { [key: string]: IElement }>(fields: T): VaryingStruct<T> & T
{
    return new VaryingStruct(fields) as VaryingStruct<T> & T;
}

