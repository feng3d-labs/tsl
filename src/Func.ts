import { analyzeDependencies } from './analyzeDependencies';
import { Attribute } from './Attribute';
import { Builtin } from './builtin/builtin';
import { IElement, ShaderValue } from './IElement';
import { Precision } from './Precision';
import { Sampler } from './Sampler';
import { IStatement } from './builtin/Statement';
import { VaryingStruct } from './varyingStruct';
import { Uniform } from './Uniform';
import { Varying } from './Varying';
import { setCurrentFunc } from './currentFunc';

/**
 * Func 类
 */
export class Func
{
    readonly name: string;
    readonly body: () => any;
    statements: IStatement[] = [];
    dependencies: IElement[] = [];
    private _analyzedDependencies?: { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<VaryingStruct<any>>; varyings: Set<Varying>; samplers: Set<Sampler>; externalVars: Array<{ name: string; expr: ShaderValue }> };

    constructor(name: string, body: () => any)
    {
        this.name = name;
        this.body = body;
    }

    /**
     * 执行函数体并收集语句和依赖（如果尚未收集）
     */
    private executeBodyIfNeeded(): void
    {
        // 如果已经有依赖，说明已经执行过 body，不需要重复执行
        if (this.dependencies.length > 0 || this.statements.length > 0)
        {
            return;
        }

        // 设置当前函数，以便 _let 和 _return 可以收集语句和依赖
        setCurrentFunc(this);

        try
        {
            this.body();
        }
        finally
        {
            // 清除当前函数引用
            setCurrentFunc(null);
        }
    }

    /**
     * 获取分析后的依赖（只分析一次，后续使用缓存）
     */
    public getAnalyzedDependencies(): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<VaryingStruct<any>>; varyings: Set<Varying>; samplers: Set<Sampler>; externalVars: Array<{ name: string; expr: ShaderValue }> }
    {
        if (!this._analyzedDependencies)
        {
            // 确保依赖已收集
            this.executeBodyIfNeeded();
            this._analyzedDependencies = analyzeDependencies(this.dependencies);
        }

        return this._analyzedDependencies;
    }

    /**
     * 转换为 GLSL 代码
     * @param shaderType 着色器类型（vertex 或 fragment）
     */
    toGLSL(shaderType: 'vertex' | 'fragment'): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        this.statements.forEach(stmt =>
        {
            const glsl = stmt.toGLSL(shaderType);
            // 过滤掉空语句
            if (glsl.trim() !== '')
            {
                lines.push(`    ${glsl}`);
            }
        });

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 转换为 WGSL 代码
     * @param shaderType 着色器类型（vertex 或 fragment）
     */
    toWGSL(shaderType: 'vertex' | 'fragment'): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成函数签名
        const stage = shaderType === 'vertex' ? '@vertex' : '@fragment';
        lines.push(stage);

        if (shaderType === 'vertex')
        {
            // Vertex shader - 从 dependencies 中获取 attributes
            const dependencies = this.getAnalyzedDependencies();
            const params: string[] = [];

            for (const attr of dependencies.attributes)
            {
                params.push(attr.toWGSL('vertex'));
            }

            // 检查是否返回结构体（通过检查是否有结构体变量被赋值）
            // 如果存在结构体变量且被赋值，则认为 vertex shader 返回结构体
            let returnStruct: VaryingStruct<any> | undefined;
            // 检查 dependencies 中是否有结构体变量（通过检查是否有 VaryingStruct 依赖）
            for (const dep of this.dependencies)
            {
                // 检查是否是结构体变量（结构体变量的 dependencies 包含 VaryingStruct）
                if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                {
                    for (const subDep of dep.dependencies)
                    {
                        if (subDep instanceof VaryingStruct)
                        {
                            // 检查这个结构体变量是否在语句中被使用（赋值或返回）
                            for (const stmt of this.statements)
                            {
                                const stmtWgsl = stmt.toWGSL(shaderType);
                                // 检查是否有对结构体字段的赋值（如 output.position = ...）
                                // 或者是否有 return 语句返回结构体变量
                                if (typeof dep.toWGSL === 'function')
                                {
                                    const varName = dep.toWGSL(shaderType);
                                    // 检查是否有对结构体字段的赋值
                                    if (stmtWgsl.includes(`${varName}.`) || stmtWgsl.includes(`return ${varName}`))
                                    {
                                        returnStruct = subDep;
                                        break;
                                    }
                                }
                            }
                            if (returnStruct)
                            {
                                break;
                            }
                        }
                    }
                }
                if (returnStruct)
                {
                    break;
                }
            }

            // 如果没有找到结构体变量，检查是否有对 builtin 和 varying 的直接赋值
            // 如果有，自动创建结构体来包装这些变量
            if (!returnStruct)
            {
                /**
                 * 从 ShaderValue 中提取基础变量（Builtin 或 Varying）
                 * @param value ShaderValue 实例
                 * @returns Builtin 或 Varying 实例，如果找不到则返回 null
                 */
                const extractBaseVar = (value: ShaderValue): Builtin | Varying | null =>
                {
                    if (!value || typeof value !== 'object' || !('dependencies' in value) || !Array.isArray(value.dependencies) || value.dependencies.length === 0)
                    {
                        return null;
                    }

                    const firstDep = value.dependencies[0];

                    // 直接是 Builtin 或 Varying
                    if (firstDep instanceof Builtin || firstDep instanceof Varying)
                    {
                        return firstDep;
                    }

                    // 处理成员访问的情况（如 gl_Position.z），递归查找 Builtin 或 Varying
                    if (firstDep && typeof firstDep === 'object' && 'dependencies' in firstDep && Array.isArray(firstDep.dependencies) && firstDep.dependencies.length > 0)
                    {
                        const secondDep = firstDep.dependencies[0];
                        if (secondDep instanceof Builtin || secondDep instanceof Varying)
                        {
                            return secondDep;
                        }
                    }

                    return null;
                };

                // 收集所有对 builtin 和 varying 的赋值
                const builtinSet = new Set<Builtin>();
                const varyingSet = new Set<Varying>();

                for (const stmt of this.statements)
                {
                    const stmtAny = stmt as any;
                    if (stmtAny._assignTarget && stmtAny._assignValue)
                    {
                        const target = stmtAny._assignTarget as ShaderValue;
                        const baseVar = extractBaseVar(target);
                        if (baseVar instanceof Builtin)
                        {
                            builtinSet.add(baseVar);
                        }
                        else if (baseVar instanceof Varying)
                        {
                            varyingSet.add(baseVar);
                        }
                    }
                }

                // 如果有对 builtin 或 varying 的赋值，创建结构体
                if (builtinSet.size > 0 || varyingSet.size > 0)
                {
                    const autoStructName = 'VertexOutput';
                    const structVarName = 'output';

                    // 创建结构体字段
                    const structFields: { [key: string]: IElement } = {};
                    const structFieldMap = new Map<Builtin | Varying, string>();

                    // 添加 builtin 字段
                    for (const builtin of builtinSet)
                    {
                        // 如果没有 name，使用默认名称（这种情况不应该发生，因为 builtin 应该在 varyingStruct 中初始化）
                        // 但为了兼容自动生成结构体的逻辑，我们使用 builtinName 作为字段名
                        const fieldName = builtin.name || builtin.builtinName;
                        // 设置 name（如果还没有设置）
                        if (!builtin.name)
                        {
                            builtin.setName(fieldName);
                        }
                        // 使用 builtin.value（Vec4）作为结构体字段
                        structFields[fieldName] = builtin.value!;
                        structFieldMap.set(builtin, fieldName);
                    }

                    // 添加 varying 字段
                    for (const varying of varyingSet)
                    {
                        // 如果没有 name，使用默认名称（这种情况不应该发生，因为 varying 应该在 varyingStruct 中初始化）
                        // 但为了兼容自动生成结构体的逻辑，我们使用 location 作为字段名的一部分
                        const fieldName = varying.name || `varying_${varying.getEffectiveLocation()}`;
                        // 设置 name（如果还没有设置）
                        if (!varying.name)
                        {
                            varying.setName(fieldName);
                        }
                        // 使用 varying.value 作为结构体字段
                        structFields[fieldName] = varying.value!;
                        structFieldMap.set(varying, fieldName);
                    }

                    // 创建结构体
                    returnStruct = new VaryingStruct(autoStructName, structFields);

                    // 创建结构体变量
                    const structVar = {
                        toGLSL: () => '',
                        toWGSL: () => structVarName,
                        dependencies: [returnStruct],
                    } as IElement;

                    /**
                     * 递归重写 ShaderValue 的 toWGSL 方法
                     * 使其在结构体上下文中返回正确的字段访问（如 output.position_vec4）
                     * @param value ShaderValue 实例
                     */
                    const rewriteToWGSL = (value: ShaderValue): void =>
                    {
                        if (!value || typeof value !== 'object' || !('dependencies' in value) || !Array.isArray(value.dependencies) || value.dependencies.length === 0)
                        {
                            return;
                        }

                        const firstDep = value.dependencies[0];

                        // 直接是 Builtin 或 Varying，重写 toWGSL 方法
                        if (firstDep instanceof Builtin || firstDep instanceof Varying)
                        {
                            const fieldName = structFieldMap.get(firstDep);
                            if (fieldName)
                            {
                                // 重写 toWGSL 方法，返回结构体字段访问
                                value.toWGSL = (type: 'vertex' | 'fragment') => `${structVarName}.${fieldName}`;
                            }

                            return;
                        }

                        // 处理成员访问的情况（如 gl_Position.z），递归处理
                        if (firstDep && typeof firstDep === 'object' && 'dependencies' in firstDep && Array.isArray(firstDep.dependencies) && firstDep.dependencies.length > 0)
                        {
                            rewriteToWGSL(firstDep as ShaderValue);
                        }
                    };

                    // 重写所有相关的 ShaderValue 的 toWGSL 方法
                    for (const builtin of builtinSet)
                    {
                        if (builtin.value)
                        {
                            rewriteToWGSL(builtin.value);
                        }
                    }
                    for (const varying of varyingSet)
                    {
                        if (varying.value)
                        {
                            rewriteToWGSL(varying.value);
                        }
                    }

                    // 添加结构体变量声明语句
                    const newStatements: IStatement[] = [];
                    newStatements.push({
                        toGLSL: () => '',
                        toWGSL: () => `var ${structVarName}: ${autoStructName};`,
                    });

                    // 保留所有原有语句（由于已经重写了 toWGSL 方法，赋值语句会自动使用正确的结构体字段访问）
                    for (const stmt of this.statements)
                    {
                        newStatements.push(stmt);
                    }

                    // 添加 return 语句
                    newStatements.push({
                        toGLSL: () => '',
                        toWGSL: () => `return ${structVarName};`,
                    });

                    // 替换 statements
                    this.statements = newStatements;

                    // 添加结构体变量到 dependencies
                    this.dependencies.push(structVar);

                    // 清除缓存，以便重新分析依赖（包含新创建的结构体）
                    this._analyzedDependencies = undefined;
                }
            }

            // 如果没有找到 return 语句，但存在结构体变量且有赋值操作，也认为返回结构体
            // 需要在最后添加 return 语句
            if (returnStruct && !this.statements.some(stmt => stmt.toWGSL(shaderType).includes('return')))
            {
                // 找到结构体变量名
                for (const dep of this.dependencies)
                {
                    if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                    {
                        for (const subDep of dep.dependencies)
                        {
                            if (subDep instanceof VaryingStruct && subDep === returnStruct)
                            {
                                if (typeof dep.toWGSL === 'function')
                                {
                                    const varName = dep.toWGSL(shaderType);
                                    // 添加 return 语句
                                    this.statements.push({
                                        toGLSL: () => '',
                                        toWGSL: () => `return ${varName};`,
                                    });
                                }
                                break;
                            }
                        }
                    }
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            // 如果返回结构体，使用结构体类型；否则使用默认的 vec4<f32>
            const returnType = returnStruct ? returnStruct.structName : '@builtin(position) vec4<f32>';
            lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);

            this.statements.forEach(stmt =>
            {
                lines.push(`    ${stmt.toWGSL(shaderType)}`);
            });
        }
        else
        {
            // Fragment shader
            // 检查是否有包含 varying 的结构体变量作为输入参数
            const dependencies = this.getAnalyzedDependencies();
            let inputStruct: { varName: string; struct: VaryingStruct<any> } | undefined;

            for (const dep of this.dependencies)
            {
                // 检查是否是结构体变量（结构体变量的 dependencies 包含 VaryingStruct）
                if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                {
                    for (const subDep of dep.dependencies)
                    {
                        if (subDep instanceof VaryingStruct && subDep.hasVarying())
                        {
                            // 找到包含 varying 的结构体变量
                            if (typeof dep.toWGSL === 'function')
                            {
                                const varName = dep.toWGSL(shaderType);
                                inputStruct = { varName, struct: subDep };
                                break;
                            }
                        }
                    }
                    if (inputStruct)
                    {
                        break;
                    }
                }
            }

            // 如果没有找到结构体变量，检查是否有直接使用的 varying
            // 如果有，直接在函数参数中添加 varying 定义
            const varyingParams: string[] = [];
            if (!inputStruct && dependencies.varyings.size > 0)
            {
                // 收集所有使用的 varying，生成函数参数
                for (const varying of dependencies.varyings)
                {
                    if (varying.value)
                    {
                        const wgslType = varying.value.wgslType;
                        const effectiveLocation = varying.getEffectiveLocation();
                        const location = `@location(${effectiveLocation})`;
                        varyingParams.push(`${location} ${varying.name}: ${wgslType}`);
                    }
                }
            }

            // 生成函数参数
            let paramStr = '()';
            if (inputStruct)
            {
                // 使用结构体作为参数
                paramStr = `(\n    ${inputStruct.varName}: ${inputStruct.struct.structName}\n)`;
            }
            else if (varyingParams.length > 0)
            {
                // 使用 varying 作为参数
                paramStr = `(\n    ${varyingParams.map(p => `${p},`).join('\n    ')}\n)`;
            }
            lines.push(`fn ${this.name}${paramStr} -> @location(0) vec4<f32> {`);

            this.statements.forEach(stmt =>
            {
                lines.push(`    ${stmt.toWGSL(shaderType)}`);
            });
        }

        lines.push('}');

        return lines.join('\n');
    }

}

/**
 * 定义函数（通用函数，不指定着色器类型）
 * @param name 函数名
 * @param body 函数体
 * @returns Func 实例
 */
export function func(name: string, body: () => any): Func
{
    return new Func(name, body);
}
