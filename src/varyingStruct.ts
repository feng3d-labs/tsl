import { getBuildParam } from './buildShader';
import { Builtin } from './builtin/builtin';
import { IElement } from './IElement';
import { Varying } from './varying';

/**
 * VaryingStruct 类
 * 专门用于在顶点和片段着色器之间传递数据
 * 仅支持 Builtin 和 Varying 成员
 */
export class VaryingStruct<T extends { [key: string]: IElement }> implements IElement
{
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;
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
    toGLSLDefinition(type: 'vertex' | 'fragment' = 'fragment'): string
    {
        // 分配 location：按照字段定义顺序，为所有 varying 字段分配唯一的 location
        this.allocateVaryingLocations();

        const varyingDeclarations: string[] = [];
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;

        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.value)
            {
                const glslType = dep.value.glslType;
                if (version === 2)
                {
                    // WebGL 2.0 中，varyings（顶点到片段的变量）不需要 layout(location)
                    // 只需要使用 out（vertex shader）或 in（fragment shader）
                    const inOut = type === 'vertex' ? 'out' : 'in';
                    varyingDeclarations.push(`${inOut} ${glslType} ${fieldName}`);
                }
                else
                {
                    varyingDeclarations.push(`varying ${glslType} ${fieldName}`);
                }
            }
        }

        return varyingDeclarations.length > 0 ? `${varyingDeclarations.join(';\n')};` : '';
    }

    /**
     * 生成 WGSL 结构体定义
     * 自动为没有显式指定 location 的 varying 字段分配 location
     * @returns WGSL 结构体定义字符串
     */
    toWGSLDefinition(): string
    {
        // 分配 location：按照字段定义顺序，为所有 varying 字段分配唯一的 location
        this.allocateVaryingLocations();

        // 生成字段定义
        const fieldDefs = Object.entries(this.fields).map(([fieldName, value]) =>
        {
            const dep = value.dependencies[0];
            if (dep instanceof Builtin)
            {
                // 排除 front_facing 相关的 builtin，它们不应该出现在顶点着色器的输出结构体中
                if (dep.isFrontFacing)
                {
                    return null;
                }
                
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
        }).filter(Boolean) as string[];
        // 格式化结构体定义，每个字段占一行，使用逗号分隔（所有字段后面都有逗号）
        if (fieldDefs.length === 0)
        {
            return `struct VaryingStruct {}`;
        }
        const formattedFields = fieldDefs.map((field) => `    ${field},`).join('\n');

        return `struct VaryingStruct {\n${formattedFields}\n}`;
    }

    /**
     * 为结构体中的 varying 字段分配 location
     * 按照字段定义顺序，显式指定的 location 优先，未指定的自动分配
     */
    private allocateVaryingLocations(): void
    {
        const usedLocations = new Set<number>();

        // 第一遍：记录所有显式指定的 location
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.location !== undefined)
            {
                usedLocations.add(dep.location);
            }
        }

        // 第二遍：为没有 location 的 varying 自动分配 location
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            const dep = value.dependencies[0];
            if (dep instanceof Varying && dep.location === undefined)
            {
                // 检查是否已经分配了自动 location
                const currentEffectiveLocation = dep.getEffectiveLocation();
                // 如果当前有效 location 不是 0 且已在 usedLocations 中，说明已经分配过，跳过
                if (currentEffectiveLocation !== 0 && usedLocations.has(currentEffectiveLocation))
                {
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
        // 初始化所有字段
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            this.initializeField(fieldName, value);
        }

        // 设置结构体自身的转换方法
        this.toGLSL = () => ``;
        this.toWGSL = () => this.varName;
        this.dependencies = Object.values(this.fields);
    }

    /**
     * 初始化结构体字段
     * @param fieldName 字段名
     * @param value 字段值
     */
    private initializeField(fieldName: string, value: IElement): void
    {
        // 验证字段有依赖项
        if (!value.dependencies || value.dependencies.length === 0)
        {
            throw new Error(`结构体 'VaryingStruct' 的字段 '${fieldName}' 没有依赖项，无法生成 WGSL 代码。`);
        }

        const dep = value.dependencies[0];

        // 验证字段类型
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

        // 设置字段的 toWGSL 方法：返回 'v.fieldName'
        value.toWGSL = () => `${this.varName}.${fieldName}`;

        // 设置字段的 toGLSL 方法
        this.setupFieldToGLSL(fieldName, value, dep);

        // 在字段值上添加对 VaryingStruct 的引用，以便依赖分析能找到结构体
        (value as any)._varyingStruct = this;

        // 将字段添加到实例上，使其可以直接访问
        (this as any)[fieldName] = value;
    }

    /**
     * 设置字段的 toGLSL 方法
     * @param fieldName 字段名
     * @param value 字段值
     * @param dep 字段的依赖（Builtin 或 Varying）
     */
    private setupFieldToGLSL(fieldName: string, value: IElement, dep: Builtin | Varying): void
    {
        if (dep instanceof Builtin)
        {
            // Builtin 字段：使用 Builtin 的 toGLSL 方法（返回 gl_Position 等）
            const originalToGLSL = value.toGLSL;

            value.toGLSL = () =>
            {
                // 尝试使用原始 toGLSL 方法
                if (originalToGLSL && typeof originalToGLSL === 'function')
                {
                    try
                    {
                        return originalToGLSL();
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
            // Varying 字段：返回字段名（GLSL 中直接使用字段名，不需要结构体前缀）
            value.toGLSL = () => fieldName;
        }
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

