import { Attribute } from './Attribute';
import { IElement } from './IElement';
import { Uniform } from './Uniform';
import { IStatement } from './builtin/Statement';
import { setCurrentFunc } from './currentFunc';

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
    statements: IStatement[] = [];
    dependencies: IElement[] = [];

    constructor(name: string, body: () => any, shaderType?: 'vertex' | 'fragment')
    {
        this.name = name;
        this.body = body;
        this.shaderType = shaderType;
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

        try
        {
            this.body();
        }
        finally
        {
            // 清除当前函数引用
            setCurrentFunc(null);
        }

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        this.statements.forEach(stmt =>
        {
            lines.push(stmt.toGLSL());
        });

        lines.push('}');

        return lines.join('\n');
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

        try
        {
            this.body();
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

            this.statements.forEach(stmt =>
            {
                lines.push(stmt.toWGSL());
            });
        }
        else
        {
            // Fragment shader
            lines.push(`fn ${this.name}() -> @location(0) vec4<f32> {`);

            this.statements.forEach(stmt =>
            {
                lines.push(stmt.toWGSL());
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
 * @param shaderType 着色器类型（可选）
 * @returns Func 实例
 */
export function func(name: string, body: () => any, shaderType?: 'vertex' | 'fragment'): Func
{
    return new Func(name, body, shaderType);
}
