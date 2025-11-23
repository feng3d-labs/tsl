import { analyzeDependencies } from './analyzeDependencies';
import { Attribute } from './Attribute';
import { IElement } from './IElement';
import { Precision } from './Precision';
import { IStatement } from './builtin/Statement';
import { Struct } from './struct';
import { Uniform } from './Uniform';
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
    private _analyzedDependencies?: { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<Struct<any>> };

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
    protected getAnalyzedDependencies(): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<Struct<any>> }
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
            lines.push(`    ${stmt.toGLSL(shaderType)}`);
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

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            lines.push(`fn ${this.name}${paramStr} -> @builtin(position) vec4<f32> {`);

            this.statements.forEach(stmt =>
            {
                lines.push(`    ${stmt.toWGSL(shaderType)}`);
            });
        }
        else
        {
            // Fragment shader
            lines.push(`fn ${this.name}() -> @location(0) vec4<f32> {`);

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
