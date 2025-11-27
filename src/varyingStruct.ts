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
        // 按照字段定义顺序收集所有 varying 字段，并分配 location
        const usedLocations = new Set<number>();

        // 第一遍：按照字段定义顺序遍历，记录已显式指定的 location
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.location !== undefined)
            {
                usedLocations.add(dep.location);
            }
        }

        // 第二遍：按照字段定义顺序，为没有 location 的 varying 自动分配 location
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.location === undefined)
            {
                // 检查是否已经分配了自动 location（通过检查 _autoLocation 属性）
                // 由于 _autoLocation 是私有的，我们通过 getEffectiveLocation 来判断
                // 如果 getEffectiveLocation 返回的值不在 usedLocations 中，且不是 0，说明已经分配过了
                const currentEffectiveLocation = dep.getEffectiveLocation();
                // 如果 location 是 undefined，getEffectiveLocation 会返回 _autoLocation ?? 0
                // 如果 _autoLocation 还没有设置，返回 0
                // 如果 _autoLocation 已经设置，返回 _autoLocation
                // 所以我们需要检查：如果 currentEffectiveLocation 在 usedLocations 中，说明已经分配过了
                // 但如果 currentEffectiveLocation 是 0 且 0 不在 usedLocations 中，可能是默认值，需要分配
                if (currentEffectiveLocation !== 0 && usedLocations.has(currentEffectiveLocation))
                {
                    // 已经分配过了，跳过
                    continue;
                }

                // 找到下一个未使用的 location
                let nextLocation = 0;
                while (usedLocations.has(nextLocation))
                {
                    nextLocation++;
                }

                // 分配 location
                dep.setAutoLocation(nextLocation);
                usedLocations.add(nextLocation);
            }
        }

        // 生成字段定义
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

            // 修改字段的 toGLSL 方法
            // 对于 Builtin（如 position），使用 Builtin 的 toGLSL 方法（返回 gl_Position）
            // 对于 Varying，返回字段名（GLSL 中直接使用字段名，不需要结构体前缀）
            if (dep instanceof Builtin)
            {
                // Builtin 的 toGLSL 方法会返回正确的 GLSL 名称（如 gl_Position）
                const originalToGLSL = value.toGLSL;

                value.toGLSL = (type: 'vertex' | 'fragment') =>
                {
                    // 如果原始 toGLSL 方法存在且能正常工作，使用它
                    if (originalToGLSL && typeof originalToGLSL === 'function')
                    {
                        try
                        {
                            return originalToGLSL(type);
                        }
                        catch
                        {
                            // 如果失败，回退到使用 Builtin 的 toGLSL
                        }
                    }

                    // 直接使用 Builtin 的 toGLSL 方法
                    return dep.toGLSL();
                };
            }
            else
            {
                // 对于 Varying，返回字段名
                value.toGLSL = (type: 'vertex' | 'fragment') => fieldName;
            }

            // 在字段值上添加对 VaryingStruct 的引用，以便依赖分析能找到结构体
            (value as any)._varyingStruct = this;

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

