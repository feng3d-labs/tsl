import { classToShaderConfig } from './classToShader';
import { generateMainGLSL, generateMainWGSL } from './main';
import { generateUniformsWGSL } from './uniforms';

/**
 * Shader 基类
 * 提供通用的代码生成方法
 */
export class Shader
{
    /**
     * GLSL 精度声明（仅用于 fragment shader）
     */
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    /**
     * 生成 GLSL 着色器代码
     * @param entry 入口函数名，默认为 'main'
     */
    generateGLSL(entry: string = 'main'): string
    {
        const config = classToShaderConfig(this as any, entry);
        const lines: string[] = [];

        // Fragment shader 需要 precision 声明
        if (config.type === 'fragment' && (this as any).precision)
        {
            lines.push(`precision ${(this as any).precision} float;`);
        }

        // 生成 attributes（仅 vertex shader）
        if (config.type === 'vertex' && config.attributes)
        {
            for (const attr of config.attributes)
            {
                lines.push(`attribute ${attr.type} ${attr.name};`);
            }
        }

        // 生成 uniforms
        if (config.uniforms)
        {
            for (const uniform of config.uniforms)
            {
                lines.push(`uniform ${uniform.type} ${uniform.name};`);
            }
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 生成入口函数（使用实际的函数名，而不是 entry 参数）
        const functionName = config.entryName || 'main';
        lines.push(...generateMainGLSL(config, functionName));

        return lines.join('\n') + '\n';
    }

    /**
     * 生成 WGSL 着色器代码
     * @param entry 入口函数名，默认为 'main'
     */
    generateWGSL(entry: string = 'main'): string
    {
        const config = classToShaderConfig(this as any, entry);
        const lines: string[] = [];

        // 生成 uniforms
        if (config.uniforms)
        {
            lines.push(...generateUniformsWGSL(config.uniforms));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 生成入口函数（使用实际的函数名，而不是 entry 参数）
        const functionName = config.entryName || 'main';
        lines.push(...generateMainWGSL(config, functionName));

        return lines.join('\n') + '\n';
    }
}


