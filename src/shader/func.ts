import { analyzeDependencies, AnalyzedDependencies } from '../core/analyzeDependencies';
import { IStatement } from '../core/Statement';
import { setCurrentFunc } from '../core/currentFunc';
import { IElement } from '../core/IElement';

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
     * 转换为 WGSL 代码（基础实现，生成简单的函数体）
     * 子类（Vertex、Fragment）应覆盖此方法以处理各自特有的逻辑
     */
    toWGSL(): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成简单的函数签名（子类应覆盖以生成正确的签名）
        lines.push(`fn ${this.name}() {`);

        // 生成函数体语句
        this.statements.forEach((stmt) =>
        {
            const wgsl = stmt.toWGSL();
            // 处理多行语句，为每行添加缩进
            const stmtLines = wgsl.split('\n');
            for (const line of stmtLines)
            {
                lines.push(`    ${line}`);
            }
        });

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 生成 WGSL 函数体语句（供子类使用）
     * @returns 函数体语句数组，每行已添加缩进
     */
    protected generateWGSLStatements(): string[]
    {
        const lines: string[] = [];
        this.statements.forEach((stmt) =>
        {
            const wgsl = stmt.toWGSL();
            const stmtLines = wgsl.split('\n');
            for (const line of stmtLines)
            {
                lines.push(`    ${line}`);
            }
        });

        return lines;
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
