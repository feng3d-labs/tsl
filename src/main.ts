import { FunctionCallConfig, convertTypeToWGSL, generateFunctionCallGLSL, generateFunctionCallWGSL } from './builtin/utils';

/**
 * 主函数配置
 */
export interface MainFunctionConfig
{
    /** 返回值表达式（字符串形式，兼容旧格式） */
    return?: string | FunctionCallConfig;
    /** 函数体代码（可选，如果提供则使用此代码，否则使用 return） */
    body?: string;
}

/**
 * 生成 GLSL main 函数代码
 */
export function generateMainGLSL(config: { type: string; main: MainFunctionConfig }, entry: string = 'main'): string[]
{
    const lines: string[] = [];

    // 生成入口函数
    lines.push(`void ${entry}() {`);

    if (config.main.body)
    {
        // 如果有自定义 body，使用它
        const bodyLines = config.main.body.split('\n');
        for (const line of bodyLines)
        {
            lines.push(`    ${line}`);
        }
    } else if (config.main.return)
    {
        // 使用 return 表达式
        let glslReturn: string;

        if (typeof config.main.return === 'string')
        {
            // 字符串形式：将 WGSL 语法转换为 GLSL 语法（移除类型参数，如 vec4<f32> -> vec4）
            glslReturn = config.main.return.replace(/<f32>/g, '').replace(/<i32>/g, '').replace(/<u32>/g, '');
        } else
        {
            // 对象形式：函数调用配置
            glslReturn = generateFunctionCallGLSL(config.main.return);
        }

        if (config.type === 'fragment')
        {
            lines.push(`    gl_FragColor = ${glslReturn};`);
        } else if (config.type === 'vertex')
        {
            lines.push(`    gl_Position = ${glslReturn};`);
        }
    }

    lines.push('}');

    return lines;
}

/**
 * 生成 WGSL main 函数代码
 */
export function generateMainWGSL(config: { type: string; attributes?: Array<{ name: string; type: string; location?: number }>; main: MainFunctionConfig }, entry: string = 'main'): string[]
{
    const lines: string[] = [];

    // 生成入口函数
    const stage = config.type === 'vertex' ? '@vertex' : '@fragment';
    lines.push(stage);

    if (config.type === 'vertex')
    {
        // Vertex shader
        const params: string[] = [];
        if (config.attributes)
        {
            for (const attr of config.attributes)
            {
                const wgslType = convertTypeToWGSL(attr.type);
                const location = attr.location !== undefined ? `@location(${attr.location})` : '@location(0)';
                params.push(`${location} ${attr.name}: ${wgslType}`);
            }
        }

        const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
        lines.push(`fn ${entry}${paramStr} -> @builtin(position) vec4<f32> {`);

        if (config.main.body)
        {
            const bodyLines = config.main.body.split('\n');
            for (const line of bodyLines)
            {
                lines.push(`    ${line}`);
            }
        } else if (config.main.return)
        {
            let wgslReturn: string;

            if (typeof config.main.return === 'string')
            {
                // 字符串形式：直接使用
                wgslReturn = config.main.return;
            } else
            {
                // 对象形式：函数调用配置
                wgslReturn = generateFunctionCallWGSL(config.main.return);
            }

            lines.push(`    return ${wgslReturn};`);
        }
    } else
    {
        // Fragment shader
        // 使用 vec4f 作为返回类型（vec4f 是 vec4<f32> 的别名）
        lines.push(`fn ${entry}() -> @location(0) vec4f {`);

        if (config.main.body)
        {
            const bodyLines = config.main.body.split('\n');
            for (const line of bodyLines)
            {
                lines.push(`    ${line}`);
            }
        } else if (config.main.return)
        {
            let wgslReturn: string;

            if (typeof config.main.return === 'string')
            {
                // 字符串形式：直接使用
                wgslReturn = config.main.return;
            } else
            {
                // 对象形式：函数调用配置
                wgslReturn = generateFunctionCallWGSL(config.main.return);
            }

            lines.push(`    return ${wgslReturn};`);
        }
    }

    lines.push('}');

    return lines;
}

