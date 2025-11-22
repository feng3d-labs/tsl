import { Attribute } from './Attribute';
import { Uniform } from './Uniform';
import { setCurrentFunc } from './currentFunc';
import { Statement } from './builtin/return';

/**
 * Func 标记
 */
export const FUNC_SYMBOL = Symbol('func');

/**
 * Func 类
 */
export class Func
{
    readonly __type__: typeof FUNC_SYMBOL = FUNC_SYMBOL;
    readonly name: string;
    readonly body: () => any;
    readonly shaderType?: 'vertex' | 'fragment';
    private statements: Statement[] = [];

    constructor(name: string, body: () => any, shaderType?: 'vertex' | 'fragment')
    {
        this.name = name;
        this.body = body;
        this.shaderType = shaderType;
    }

    /**
     * 添加语句（_let 或 _return）
     * @internal
     */
    addStatement(statement: Statement): void
    {
        this.statements.push(statement);
    }

    /**
     * 生成表达式的 GLSL 代码（递归处理依赖）
     */
    private generateExpressionGLSL(expr: any, letVariables: Set<string>): string
    {
        if (typeof expr === 'object' && expr !== null && 'toGLSL' in expr && typeof expr.toGLSL === 'function')
        {
            // 如果这个表达式已经被 let 语句定义了，直接返回变量名
            const exprStr = expr.toGLSL();
            if (letVariables.has(exprStr))
            {
                return exprStr;
            }

            // 检查是否是简单的变量引用（如 uniform/attribute 名称）
            if (expr.dependencies && expr.dependencies.length === 1)
            {
                const dep = expr.dependencies[0];
                if (dep instanceof Uniform || dep instanceof Attribute)
                {
                    return dep.name;
                }
            }

            // 否则生成完整的表达式代码
            return exprStr;
        }
        else if (typeof expr === 'string')
        {
            return expr.replace(/<f32>/g, '').replace(/<i32>/g, '').replace(/<u32>/g, '');
        }
        else if (expr instanceof Uniform || expr instanceof Attribute)
        {
            return expr.name;
        }
        else
        {
            return String(expr);
        }
    }

    /**
     * 转换为 GLSL 代码
     * @param shaderType 着色器类型（vertex 或 fragment）
     */
    toGLSL(shaderType: 'vertex' | 'fragment'): string
    {
        const lines: string[] = [];

        // 清空之前的语句
        this.statements = [];

        // 设置当前函数，以便 _let 和 _return 可以收集语句
        setCurrentFunc(this);

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = this.body();
        }
        finally
        {
            // 清除当前函数引用
            setCurrentFunc(null);
        }

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        // 如果有收集到的语句，使用它们生成代码
        if (this.statements.length > 0)
        {
            const letVariables = new Set<string>(); // 存储已定义的变量名

            // 处理所有语句
            for (const stmt of this.statements)
            {
                if (stmt.type === 'let' && stmt.name)
                {
                    // 生成 let 语句的表达式代码（使用原始表达式，而不是变量名）
                    // 需要从 dependencies 中获取原始表达式
                    const originalExpr = stmt.expr.dependencies && stmt.expr.dependencies.length > 0
                        ? stmt.expr.dependencies[0]
                        : stmt.expr;
                    const exprCode = this.generateExpressionGLSL(originalExpr, letVariables);
                    // GLSL 中需要声明变量类型，但这里简化处理，假设类型已推断
                    // 实际使用时可能需要根据表达式类型推断变量类型
                    lines.push(`    ${stmt.name} = ${exprCode};`);
                    letVariables.add(stmt.name);
                }
                else if (stmt.type === 'return')
                {
                    // 生成 return 语句的表达式代码
                    const exprCode = this.generateExpressionGLSL(stmt.expr, letVariables);
                    if (shaderType === 'fragment')
                    {
                        lines.push(`    gl_FragColor = ${exprCode};`);
                    }
                    else if (shaderType === 'vertex')
                    {
                        lines.push(`    gl_Position = ${exprCode};`);
                    }
                }
            }
        }
        else if (returnValue !== undefined && returnValue !== null)
        {
            // 如果没有收集到语句，使用传统方式处理返回值
            let glslReturn: string;

            if (typeof returnValue === 'object' && returnValue !== null && 'toGLSL' in returnValue && typeof returnValue.toGLSL === 'function')
            {
                // IElement 形式（Vec2, Vec4 等）
                glslReturn = returnValue.toGLSL();
            }
            else if (typeof returnValue === 'string')
            {
                // 字符串形式：将 WGSL 语法转换为 GLSL 语法（移除类型参数）
                glslReturn = returnValue.replace(/<f32>/g, '').replace(/<i32>/g, '').replace(/<u32>/g, '');
            }
            else if (returnValue instanceof Uniform || returnValue instanceof Attribute)
            {
                glslReturn = returnValue.name;
            }
            else
            {
                glslReturn = String(returnValue);
            }

            if (shaderType === 'fragment')
            {
                lines.push(`    gl_FragColor = ${glslReturn};`);
            }
            else if (shaderType === 'vertex')
            {
                lines.push(`    gl_Position = ${glslReturn};`);
            }
        }

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 生成表达式的 WGSL 代码（递归处理依赖）
     */
    private generateExpressionWGSL(expr: any, letVariables: Set<string>): string
    {
        if (typeof expr === 'object' && expr !== null && 'toWGSL' in expr && typeof expr.toWGSL === 'function')
        {
            // 如果这个表达式已经被 let 语句定义了，直接返回变量名
            const exprStr = expr.toWGSL();
            if (letVariables.has(exprStr))
            {
                return exprStr;
            }

            // 检查是否是简单的变量引用（如 uniform/attribute 名称）
            if (expr.dependencies && expr.dependencies.length === 1)
            {
                const dep = expr.dependencies[0];
                if (dep instanceof Uniform || dep instanceof Attribute)
                {
                    return dep.name;
                }
            }

            // 否则生成完整的表达式代码
            return exprStr;
        }
        else if (typeof expr === 'string')
        {
            return expr;
        }
        else if (expr instanceof Uniform || expr instanceof Attribute)
        {
            return expr.name;
        }
        else
        {
            return String(expr);
        }
    }

    /**
     * 转换为 WGSL 代码
     * @param attributes 属性列表（仅用于 vertex shader）
     */
    toWGSL(attributes?: Attribute[]): string
    {
        const lines: string[] = [];

        // 清空之前的语句
        this.statements = [];

        // 设置当前函数，以便 _let 和 _return 可以收集语句
        setCurrentFunc(this);

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = this.body();
        }
        finally
        {
            // 清除当前函数引用
            setCurrentFunc(null);
        }

        // 从 shaderType 属性获取着色器类型
        const shaderType = this.shaderType;
        if (!shaderType)
        {
            throw new Error(`函数 '${this.name}' 没有设置 shaderType，无法生成 WGSL 代码。`);
        }

        // 生成函数签名
        const stage = shaderType === 'vertex' ? '@vertex' : '@fragment';
        lines.push(stage);

        if (shaderType === 'vertex')
        {
            // Vertex shader
            const params: string[] = [];
            if (attributes)
            {
                for (const attr of attributes)
                {
                    params.push(attr.toWGSL());
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            lines.push(`fn ${this.name}${paramStr} -> @builtin(position) vec4<f32> {`);

            // 如果有收集到的语句，使用它们生成代码
            if (this.statements.length > 0)
            {
                const letVariables = new Set<string>(); // 存储已定义的变量名

                // 处理所有语句
                for (const stmt of this.statements)
                {
                    if (stmt.type === 'let' && stmt.name)
                    {
                        // 生成 let 语句的表达式代码（使用原始表达式，而不是变量名）
                        // 需要从 dependencies 中获取原始表达式
                        const originalExpr = stmt.expr.dependencies && stmt.expr.dependencies.length > 0
                            ? stmt.expr.dependencies[0]
                            : stmt.expr;
                        const exprCode = this.generateExpressionWGSL(originalExpr, letVariables);
                        lines.push(`    let ${stmt.name} = ${exprCode};`);
                        letVariables.add(stmt.name);
                    }
                    else if (stmt.type === 'return')
                    {
                        // 生成 return 语句的表达式代码
                        const exprCode = this.generateExpressionWGSL(stmt.expr, letVariables);
                        lines.push(`    return ${exprCode};`);
                    }
                }
            }
            else if (returnValue !== undefined && returnValue !== null)
            {
                // 如果没有收集到语句，使用传统方式处理返回值
                let wgslReturn: string;

                if (typeof returnValue === 'object' && returnValue !== null && 'toWGSL' in returnValue && typeof returnValue.toWGSL === 'function')
                {
                    // IElement 形式（Vec2, Vec4 等）
                    wgslReturn = returnValue.toWGSL();
                }
                else if (typeof returnValue === 'string')
                {
                    wgslReturn = returnValue;
                }
                else if (returnValue instanceof Uniform || returnValue instanceof Attribute)
                {
                    wgslReturn = returnValue.name;
                }
                else
                {
                    wgslReturn = String(returnValue);
                }

                lines.push(`    return ${wgslReturn};`);
            }
        }
        else
        {
            // Fragment shader
            lines.push(`fn ${this.name}() -> @location(0) vec4<f32> {`);

            // 如果有收集到的语句，使用它们生成代码
            if (this.statements.length > 0)
            {
                const letVariables = new Set<string>(); // 存储已定义的变量名

                // 处理所有语句
                for (const stmt of this.statements)
                {
                    if (stmt.type === 'let' && stmt.name)
                    {
                        // 生成 let 语句的表达式代码（使用原始表达式，而不是变量名）
                        // 需要从 dependencies 中获取原始表达式
                        const originalExpr = stmt.expr.dependencies && stmt.expr.dependencies.length > 0
                            ? stmt.expr.dependencies[0]
                            : stmt.expr;
                        const exprCode = this.generateExpressionWGSL(originalExpr, letVariables);
                        lines.push(`    let ${stmt.name} = ${exprCode};`);
                        letVariables.add(stmt.name);
                    }
                    else if (stmt.type === 'return')
                    {
                        // 生成 return 语句的表达式代码
                        const exprCode = this.generateExpressionWGSL(stmt.expr, letVariables);
                        lines.push(`    return ${exprCode};`);
                    }
                }
            }
            else if (returnValue !== undefined && returnValue !== null)
            {
                // 如果没有收集到语句，使用传统方式处理返回值
                let wgslReturn: string;

                if (typeof returnValue === 'object' && returnValue !== null && 'toWGSL' in returnValue && typeof returnValue.toWGSL === 'function')
                {
                    // IElement 形式（Vec2, Vec4 等）
                    wgslReturn = returnValue.toWGSL();
                }
                else if (typeof returnValue === 'string')
                {
                    wgslReturn = returnValue;
                }
                else if (returnValue instanceof Uniform || returnValue instanceof Attribute)
                {
                    wgslReturn = returnValue.name;
                }
                else
                {
                    wgslReturn = String(returnValue);
                }

                lines.push(`    return ${wgslReturn};`);
            }
        }

        lines.push('}');

        return lines.join('\n');
    }

}

/**
 * 定义函数（通用函数，不指定着色器类型）
 * @param name 函数名
 * @param body 函数体
 * @param shaderType 着色器类型（可选）
 * @returns Func 实例
 */
export function func(name: string, body: () => any, shaderType?: 'vertex' | 'fragment'): Func
{
    return new Func(name, body, shaderType);
}
