import { analyzeDependencies } from './analyzeDependencies';
import { Attribute } from './attribute';
import { getBuildParam } from './buildShader';
import { IStatement } from './builtin/Statement';
import { setCurrentFunc } from './currentFunc';
import { IElement, ShaderValue } from './IElement';
import { Precision } from './precision';
import { Sampler } from './sampler';
import { Uniform } from './uniform';
import { Varying } from './varying';
import { VaryingStruct } from './varyingStruct';

/**
 * Func 类
 */
export class Func
{
    readonly name: string;
    readonly body: () => any;
    statements: IStatement[] = [];
    dependencies: IElement[] = [];
    private _analyzedDependencies?: { attributes: Set<Attribute>; uniforms: Set<Uniform>; precisions: Set<Precision>; structs: Set<VaryingStruct<any>>; varyings: Set<Varying>; samplers: Set<Sampler>; fragmentOutput?: any; externalVars: Array<{ name: string; expr: ShaderValue }> };

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
    public getAnalyzedDependencies(): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precisions: Set<Precision>; structs: Set<VaryingStruct<any>>; varyings: Set<Varying>; samplers: Set<Sampler>; fragmentOutput?: any; externalVars: Array<{ name: string; expr: ShaderValue }> }
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
     */
    toGLSL(): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        this.statements.forEach(stmt =>
        {
            const glsl = stmt.toGLSL();
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
     */
    toWGSL(): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        const buildParam = getBuildParam();
        const shaderType = buildParam.stage;

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
                params.push(attr.toWGSL());
            }

            // 检查是否返回结构体（直接使用收集到的结构体，不重新构建）
            let returnStruct: VaryingStruct<any> | undefined;

            // 从依赖分析中查找结构体
            // 1. 检查是否是直接使用的结构体实例
            for (const dep of this.dependencies)
            {
                if (dep instanceof VaryingStruct)
                {
                    returnStruct = dep;
                    break;
                }
            }

            // 2. 检查是否是结构体变量（结构体变量的 dependencies 包含 VaryingStruct）
            if (!returnStruct)
            {
                for (const dep of this.dependencies)
                {
                    if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                    {
                        for (const subDep of dep.dependencies)
                        {
                            if (subDep instanceof VaryingStruct)
                            {
                                returnStruct = subDep;
                                break;
                            }
                        }
                        if (returnStruct)
                        {
                            break;
                        }
                    }
                }
            }

            // 3. 从字段值中查找结构体（通过 _varyingStruct 属性）
            if (!returnStruct)
            {
                for (const dep of this.dependencies)
                {
                    if (dep && typeof dep === 'object' && (dep as any)._varyingStruct instanceof VaryingStruct)
                    {
                        returnStruct = (dep as any)._varyingStruct;
                        break;
                    }
                }
            }

            // 4. 从依赖分析的 structs 集合中获取（如果只有一个结构体）
            if (!returnStruct)
            {
                const dependencies = this.getAnalyzedDependencies();
                if (dependencies.structs.size === 1)
                {
                    returnStruct = Array.from(dependencies.structs)[0];
                }
            }

            // 如果找到了结构体变量（直接使用 varyingStruct），需要添加 var v: VaryingStruct; 声明
            if (returnStruct)
            {
                // 检查是否已经添加了 var v: VaryingStruct; 声明
                const hasVarDeclaration = this.statements.some(stmt => stmt.toWGSL().includes('var v: VaryingStruct'));
                if (!hasVarDeclaration)
                {
                    // 在函数体开头添加 var v: VaryingStruct; 声明
                    const newStatements: IStatement[] = [];
                    newStatements.push({
                        toGLSL: () => '',
                        toWGSL: () => `var v: VaryingStruct;`,
                    });
                    // 保留所有原有语句
                    for (const stmt of this.statements)
                    {
                        newStatements.push(stmt);
                    }
                    this.statements = newStatements;
                }

                // 如果没有找到 return 语句，但存在结构体变量且有赋值操作，也认为返回结构体
                // 需要在最后添加 return 语句
                if (!this.statements.some(stmt => stmt.toWGSL().includes('return')))
                {
                    // 添加 return 语句（变量名固定为 v）
                    this.statements.push({
                        toGLSL: () => '',
                        toWGSL: () => `return v;`,
                    });
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            // 如果返回结构体，使用结构体类型；否则使用默认的 vec4<f32>
            const returnType = returnStruct ? 'VaryingStruct' : '@builtin(position) vec4<f32>';
            lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);

            this.statements.forEach(stmt =>
            {
                lines.push(`    ${stmt.toWGSL()}`);
            });
        }
        else
        {
            // Fragment shader
            // 检查是否有包含 varying 的结构体变量作为输入参数
            // 函数中最多只会出现一个 VaryingStruct
            const dependencies = this.getAnalyzedDependencies();
            let inputStruct: { varName: string; struct: VaryingStruct<any> } | undefined;

            // 查找第一个包含 varying 的结构体（函数中最多只有一个）
            for (const struct of dependencies.structs)
            {
                if (struct.hasVarying())
                {
                    // 递归查找使用该结构体的变量名
                    const findStructInDependencies = (deps: any[]): boolean =>
                    {
                        for (const dep of deps)
                        {
                            // 检查 dep 本身是否是 VaryingStruct 实例
                            if (dep === struct)
                            {
                                // 找到直接使用的结构体变量
                                if (typeof dep.toWGSL === 'function')
                                {
                                    const varName = dep.toWGSL();

                                    inputStruct = { varName, struct };

                                    return true;
                                }
                            }
                            // 检查是否是结构体字段值（通过 _varyingStruct 属性）
                            else if (dep && typeof dep === 'object' && (dep as any)._varyingStruct === struct)
                            {
                                // 找到使用该结构体的字段值，使用结构体的变量名
                                const varName = struct.toWGSL();

                                inputStruct = { varName, struct };

                                return true;
                            }
                            // 递归检查依赖的 dependencies
                            else if (dep && typeof dep === 'object' && 'dependencies' in dep && Array.isArray(dep.dependencies))
                            {
                                // 先检查 dependencies 中是否包含结构体本身
                                if (dep.dependencies.includes(struct))
                                {
                                    // 找到使用该结构体的变量
                                    if (typeof dep.toWGSL === 'function')
                                    {
                                        const varName = dep.toWGSL();

                                        inputStruct = { varName, struct };

                                        return true;
                                    }
                                }
                                // 递归检查嵌套的 dependencies
                                if (findStructInDependencies(dep.dependencies))
                                {
                                    return true;
                                }
                            }
                        }

                        return false;
                    };

                    // 从顶层依赖开始查找
                    if (findStructInDependencies(this.dependencies))
                    {
                        // 找到第一个包含 varying 的结构体后直接退出
                        break;
                    }
                }
            }

            // 生成函数参数
            // Fragment shader 只支持两种参数形式：
            // 1. 没有参数：()
            // 2. 使用结构体作为参数：(v: VaryingStruct)
            // 不再支持单独的 varying 参数
            let paramStr = '()';
            if (inputStruct)
            {
                // 使用结构体作为参数（变量名固定为 v，结构体名称固定为 VaryingStruct）
                paramStr = `(v: VaryingStruct)`;
            }
            lines.push(`fn ${this.name}${paramStr} -> @location(0) vec4<f32> {`);

            this.statements.forEach(stmt =>
            {
                lines.push(`    ${stmt.toWGSL()}`);
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
