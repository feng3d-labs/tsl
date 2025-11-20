import { convertTypeToWGSL } from './vec4';

/**
 * 统一变量配置
 */
export interface UniformConfig
{
    /** 变量名 */
    name: string;
    /** 类型：vec2, vec3, vec4, float, int, mat2, mat3, mat4 等 */
    type: string;
    /** WGSL 绑定位置 */
    binding?: number;
    /** WGSL 绑定组 */
    group?: number;
}

/**
 * 生成 GLSL uniforms 代码
 */
export function generateUniformsGLSL(uniforms: UniformConfig[] | undefined): string[]
{
    const lines: string[] = [];

    if (uniforms)
    {
        for (const uniform of uniforms)
        {
            lines.push(`uniform ${uniform.type} ${uniform.name};`);
        }
    }

    return lines;
}

/**
 * 生成 WGSL uniforms 代码
 */
export function generateUniformsWGSL(uniforms: UniformConfig[] | undefined): string[]
{
    const lines: string[] = [];

    if (uniforms)
    {
        for (const uniform of uniforms)
        {
            const wgslType = convertTypeToWGSL(uniform.type);
            const binding = uniform.binding !== undefined ? `@binding(${uniform.binding})` : '';
            const group = uniform.group !== undefined ? `@group(${uniform.group})` : '';
            const annotations = [binding, group].filter(Boolean).join(' ');
            lines.push(`${annotations} var<uniform> ${uniform.name} : ${wgslType};`);
        }
    }

    return lines;
}

