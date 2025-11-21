import { FunctionCallConfig, generateFunctionCallGLSL, generateFunctionCallWGSL, convertTypeToWGSL } from './vec4';
import { Attribute } from './Attribute';
import { Uniform } from './Uniform';

/**
 * Func 标记
 */
export const FUNC_SYMBOL = Symbol('func');

/**
 * Func 类
 */
export class Func
{
    readonly __type__ = FUNC_SYMBOL;
    readonly name: string;
    readonly body: () => any;
    readonly shaderType?: 'vertex' | 'fragment';

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

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = this.body();
        }
        catch (error)
        {
            throw new Error(`执行函数 '${this.name}' 时出错: ${error}`);
        }

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        if (returnValue !== undefined && returnValue !== null)
        {
            let glslReturn: string;

            if (typeof returnValue === 'string')
            {
                // 字符串形式：将 WGSL 语法转换为 GLSL 语法（移除类型参数）
                glslReturn = returnValue.replace(/<f32>/g, '').replace(/<i32>/g, '').replace(/<u32>/g, '');
            }
            else if (typeof returnValue === 'object' && 'function' in returnValue)
            {
                // 对象形式：函数调用配置
                glslReturn = generateFunctionCallGLSL(returnValue as FunctionCallConfig);
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
     * 转换为 WGSL 代码
     * @param shaderType 着色器类型（vertex 或 fragment）
     * @param attributes 属性列表（仅用于 vertex shader）
     */
    toWGSL(shaderType: 'vertex' | 'fragment', attributes?: Array<{ name: string; type: string; location?: number }>): string
    {
        const lines: string[] = [];

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = this.body();
        }
        catch (error)
        {
            throw new Error(`执行函数 '${this.name}' 时出错: ${error}`);
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
                    const wgslType = convertTypeToWGSL(attr.type);
                    const location = attr.location !== undefined ? `@location(${attr.location})` : '@location(0)';
                    params.push(`${location} ${attr.name}: ${wgslType}`);
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            lines.push(`fn ${this.name}${paramStr} -> @builtin(position) vec4<f32> {`);

            if (returnValue !== undefined && returnValue !== null)
            {
                let wgslReturn: string;

                if (typeof returnValue === 'string')
                {
                    wgslReturn = returnValue;
                }
                else if (typeof returnValue === 'object' && 'function' in returnValue)
                {
                    wgslReturn = generateFunctionCallWGSL(returnValue as FunctionCallConfig);
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

            if (returnValue !== undefined && returnValue !== null)
            {
                let wgslReturn: string;

                if (typeof returnValue === 'string')
                {
                    wgslReturn = returnValue;
                }
                else if (typeof returnValue === 'object' && 'function' in returnValue)
                {
                    wgslReturn = generateFunctionCallWGSL(returnValue as FunctionCallConfig);
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

    /**
     * 转换为配置对象
     * @param shaderType 着色器类型（vertex 或 fragment）
     */
    toConfig(shaderType: 'vertex' | 'fragment'): { name: string; return?: string | FunctionCallConfig }
    {
        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = this.body();
        }
        catch (error)
        {
            throw new Error(`执行函数 '${this.name}' 时出错: ${error}`);
        }

        const config: { name: string; return?: string | FunctionCallConfig } = {
            name: this.name,
        };

        if (returnValue !== undefined && returnValue !== null)
        {
            if (typeof returnValue === 'string')
            {
                config.return = returnValue;
            }
            else if (typeof returnValue === 'object' && 'function' in returnValue)
            {
                config.return = returnValue as FunctionCallConfig;
            }
            else if (returnValue instanceof Uniform || returnValue instanceof Attribute)
            {
                config.return = returnValue.name;
            }
            else
            {
                config.return = String(returnValue);
            }
        }

        return config;
    }

    /**
     * 转换为字符串时返回函数名
     */
    toString(): string
    {
        return this.name;
    }

    /**
     * 转换为原始值时返回函数名
     */
    valueOf(): string
    {
        return this.name;
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
