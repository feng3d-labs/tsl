import { analyzeDependencies, AnalyzedDependencies } from './analyzeDependencies';
import { getBuildParam } from './buildShader';
import { IStatement } from './builtin/Statement';
import { setCurrentFunc } from './currentFunc';
import { IElement } from './IElement';

/**
 * Func 类
 */
export class Func
{
    readonly name: string;
    readonly body: () => any;
    statements: IStatement[] = [];
    dependencies: IElement[] = [];
    private _analyzedDependencies?: AnalyzedDependencies;

    constructor(name: string, body: () => any)
    {
        this.name = name;
        this.body = body;
    }

    /**
     * 执行函数体并收集语句和依赖（如果尚未收集）
     */
    protected executeBodyIfNeeded(): void
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
    public getAnalyzedDependencies(): AnalyzedDependencies
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
                // 处理多行语句，为每行添加缩进
                const stmtLines = glsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
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
            // Vertex shader - 从 dependencies 中获取 attributes 和 builtins
            const dependencies = this.getAnalyzedDependencies();
            const params: string[] = [];

            for (const attr of dependencies.attributes)
            {
                params.push(attr.toWGSL());
            }

            // 添加 builtins 参数（只添加输入类型的 builtin，如 vertex_index）
            for (const builtin of dependencies.builtins)
            {
                // 只添加输入类型的 builtin（vertex_index、instance_index 等）
                if (builtin.isVertexIndex || builtin.isInstanceIndex)
                {
                    params.push(builtin.toWGSL());
                }
            }

            // 检查是否需要返回 VaryingStruct（有 varying 或 position builtin）
            const hasPositionBuiltin = Array.from(dependencies.builtins).some(b => b.isPosition);
            const hasVaryings = dependencies.varyings.size > 0;
            const needsVaryingStruct = hasPositionBuiltin || hasVaryings;

            // 如果需要 VaryingStruct，添加 var v: VaryingStruct; 声明和 return v;
            if (needsVaryingStruct)
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

                // 如果没有找到 return 语句，添加 return v;
                if (!this.statements.some(stmt => stmt.toWGSL().includes('return')))
                {
                    this.statements.push({
                        toGLSL: () => '',
                        toWGSL: () => `return v;`,
                    });
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            // 如果需要 VaryingStruct，使用结构体类型；否则使用默认的 vec4<f32>
            const returnType = needsVaryingStruct ? 'VaryingStruct' : '@builtin(position) vec4<f32>';
            lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);

            // 生成函数体
            this.statements.forEach(stmt =>
            {
                const wgsl = stmt.toWGSL();
                // 处理多行语句，为每行添加缩进
                const stmtLines = wgsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
            });
        }
        else
        {
            // Fragment shader
            const dependencies = this.getAnalyzedDependencies();

            // 生成函数参数
            const params: string[] = [];

            // 如果有 varying，添加结构体参数
            if (dependencies.varyings.size > 0)
            {
                params.push(`v: VaryingStruct`);
            }

            // 添加 builtins 参数（只添加 fragment shader 输入类型的 builtin，如 gl_FragCoord 和 gl_FrontFacing）
            for (const builtin of dependencies.builtins)
            {
                if (builtin.isFragCoord || builtin.isFrontFacing)
                {
                    params.push(builtin.toWGSL());
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';

            // 检查是否有返回语句（判断是否是空片段着色器，如深度-only 渲染）
            const hasReturn = this.statements.some(stmt => stmt.toWGSL().includes('return'));
            if (hasReturn)
            {
                // 有返回语句，添加返回类型
                lines.push(`fn ${this.name}${paramStr} -> @location(0) vec4<f32> {`);
            }
            else
            {
                // 没有返回语句（空片段着色器，仅写深度），不添加返回类型
                lines.push(`fn ${this.name}${paramStr} {`);
            }

            this.statements.forEach(stmt =>
            {
                const wgsl = stmt.toWGSL();
                // 处理多行语句，为每行添加缩进
                const stmtLines = wgsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
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
