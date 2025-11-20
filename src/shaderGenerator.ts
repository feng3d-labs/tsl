import { MainFunctionConfig, generateMainGLSL, generateMainWGSL } from './main';
import { UniformConfig, generateUniformsGLSL, generateUniformsWGSL } from './uniforms';

/**
 * 属性变量配置（用于 vertex shader）
 */
export interface AttributeConfig
{
    /** 变量名 */
    name: string;
    /** 类型：vec2, vec3, vec4, float 等 */
    type: string;
    /** WGSL location */
    location?: number;
}

/**
 * 着色器配置接口
 */
export interface ShaderConfig
{
    /** 着色器类型：vertex 或 fragment */
    type: 'vertex' | 'fragment' | string;
    /** GLSL 精度声明（仅用于 fragment shader） */
    precision?: 'lowp' | 'mediump' | 'highp' | string;
    /** 统一变量列表 */
    uniforms?: UniformConfig[];
    /** 属性变量列表（仅用于 vertex shader） */
    attributes?: AttributeConfig[];
    /** 主函数配置 */
    main: MainFunctionConfig;
}

// 重新导出类型以便向后兼容（通过 index.ts 统一导出）

/**
 * 生成 GLSL 着色器代码
 */
export function generateGLSL(config: ShaderConfig): string
{
    const lines: string[] = [];

    // Fragment shader 需要 precision 声明
    if (config.type === 'fragment' && config.precision)
    {
        lines.push(`precision ${config.precision} float;`);
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
    lines.push(...generateUniformsGLSL(config.uniforms));

    // 空行
    if (lines.length > 0)
    {
        lines.push('');
    }

    // 生成 main 函数
    lines.push(...generateMainGLSL(config));

    return lines.join('\n') + '\n';
}

/**
 * 生成 WGSL 着色器代码
 */
export function generateWGSL(config: ShaderConfig): string
{
    const lines: string[] = [];

    // 生成 uniforms
    lines.push(...generateUniformsWGSL(config.uniforms));

    // 空行
    if (lines.length > 0)
    {
        lines.push('');
    }

    // 生成 main 函数（包含 attributes 处理）
    lines.push(...generateMainWGSL(config));

    return lines.join('\n') + '\n';
}

/**
 * 从 JSON 配置生成 GLSL 和 WGSL 代码
 */
export function generateShaders(config: ShaderConfig): { glsl: string; wgsl: string }
{
    return {
        glsl: generateGLSL(config),
        wgsl: generateWGSL(config),
    };
}

