import { analyzeDependencies } from './analyzeDependencies';
import { Attribute } from './Attribute';
import { Builtin } from './builtin/builtin';
import { IElement, IType } from './IElement';
import { Precision } from './Precision';
import { IStatement } from './builtin/Statement';
import { Struct } from './struct';
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
    private _analyzedDependencies?: { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<Struct<any>>; varyings: Set<Varying> };

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
    protected getAnalyzedDependencies(): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<Struct<any>>; varyings: Set<Varying> }
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
            let returnStruct: Struct<any> | undefined;
            // 检查 dependencies 中是否有结构体变量（通过检查是否有 Struct 依赖）
            for (const dep of this.dependencies)
            {
                // 检查是否是结构体变量（结构体变量的 dependencies 包含 Struct）
                if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                {
                    for (const subDep of dep.dependencies)
                    {
                        if (subDep instanceof Struct)
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
                const builtinAssignments = new Map<Builtin, { target: IType; fieldName: string; value: IType }>();
                const varyingAssignments = new Map<Varying, { target: IType; fieldName: string; value: IType }>();

                // 从 statements 中找出所有对 builtin 和 varying 的赋值
                // 使用保存在 statement 中的原始信息
                for (const stmt of this.statements)
                {
                    const stmtAny = stmt as any;
                    if (stmtAny._assignTarget && stmtAny._assignValue)
                    {
                        const target = stmtAny._assignTarget as IType;
                        const value = stmtAny._assignValue as IType;

                        // 检查 target 是否是 builtin 或 varying
                        if (target && typeof target === 'object' && 'dependencies' in target && Array.isArray(target.dependencies) && target.dependencies.length > 0)
                        {
                            const firstDep = target.dependencies[0];
                            if (firstDep instanceof Builtin)
                            {
                                const fieldName = firstDep.isPosition ? 'position' : firstDep.varName;
                                if (!builtinAssignments.has(firstDep))
                                {
                                    builtinAssignments.set(firstDep, { target, fieldName, value });
                                }
                            }
                            else if (firstDep instanceof Varying)
                            {
                                const fieldName = firstDep.name;
                                if (!varyingAssignments.has(firstDep))
                                {
                                    varyingAssignments.set(firstDep, { target, fieldName, value });
                                }
                            }
                        }
                    }
                }

                // 如果有对 builtin 或 varying 的赋值，创建结构体
                if (builtinAssignments.size > 0 || varyingAssignments.size > 0)
                {
                    // 创建结构体字段
                    const structFields: { [key: string]: IElement } = {};

                    // 添加 builtin 字段
                    for (const [builtin, { target }] of builtinAssignments)
                    {
                        structFields[builtin.isPosition ? 'position' : builtin.varName] = target;
                    }

                    // 添加 varying 字段
                    for (const [varying, { target }] of varyingAssignments)
                    {
                        structFields[varying.name] = target;
                    }

                    // 创建结构体
                    const autoStructName = 'VertexOutput';
                    returnStruct = new Struct(autoStructName, structFields);

                    // 创建结构体变量
                    const structVarName = 'output';
                    const structVar = {
                        toGLSL: () => '',
                        toWGSL: () => structVarName,
                        dependencies: [returnStruct],
                    } as IElement;

                    // 修改赋值语句，使其赋值给结构体字段
                    const newStatements: IStatement[] = [];
                    newStatements.push({
                        toGLSL: () => '',
                        toWGSL: () => `var ${structVarName}: ${autoStructName};`,
                    });

                    // 使用保存的原始信息来匹配赋值语句
                    for (let i = 0; i < this.statements.length; i++)
                    {
                        const stmt = this.statements[i];
                        const stmtAny = stmt as any;

                        // 检查是否是 assign 语句（有保存的原始信息）
                        if (stmtAny._assignTarget && stmtAny._assignValue)
                        {
                            const target = stmtAny._assignTarget as IType;
                            const value = stmtAny._assignValue as IType;

                            // 检查 target 是否是 builtin 或 varying
                            if (target && typeof target === 'object' && 'dependencies' in target && Array.isArray(target.dependencies) && target.dependencies.length > 0)
                            {
                                const firstDep = target.dependencies[0];
                                let isBuiltinOrVaryingAssignment = false;
                                let fieldName = '';

                                if (firstDep instanceof Builtin)
                                {
                                    fieldName = firstDep.isPosition ? 'position' : firstDep.varName;
                                    isBuiltinOrVaryingAssignment = builtinAssignments.has(firstDep);
                                }
                                else if (firstDep instanceof Varying)
                                {
                                    fieldName = firstDep.name;
                                    isBuiltinOrVaryingAssignment = varyingAssignments.has(firstDep);
                                }

                                if (isBuiltinOrVaryingAssignment)
                                {
                                    // 转换为结构体字段赋值
                                    const valueExpr = value.toWGSL(shaderType);
                                    newStatements.push({
                                        toGLSL: stmt.toGLSL,
                                        toWGSL: () => `${structVarName}.${fieldName} = ${valueExpr};`,
                                    });
                                }
                                else
                                {
                                    // 保留其他语句
                                    newStatements.push(stmt);
                                }
                            }
                            else
                            {
                                // 保留其他语句
                                newStatements.push(stmt);
                            }
                        }
                        else
                        {
                            // 保留非赋值语句
                            newStatements.push(stmt);
                        }
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
                            if (subDep instanceof Struct && subDep === returnStruct)
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
            let inputStruct: { varName: string; struct: Struct<any> } | undefined;

            for (const dep of this.dependencies)
            {
                // 检查是否是结构体变量（结构体变量的 dependencies 包含 Struct）
                if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                {
                    for (const subDep of dep.dependencies)
                    {
                        if (subDep instanceof Struct && subDep.hasVarying())
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
                        const location = varying.location !== undefined ? `@location(${varying.location})` : '@location(0)';
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
