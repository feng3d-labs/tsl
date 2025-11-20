/**
 * 着色器配置接口
 */
export interface ShaderConfig
{
    /** 着色器类型：vertex 或 fragment */
    type: 'vertex' | 'fragment';
    /** GLSL 精度声明（仅用于 fragment shader） */
    precision?: 'lowp' | 'mediump' | 'highp';
    /** 统一变量列表 */
    uniforms?: UniformConfig[];
    /** 属性变量列表（仅用于 vertex shader） */
    attributes?: AttributeConfig[];
    /** 主函数配置 */
    main: MainFunctionConfig;
}

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
 * 主函数配置
 */
export interface MainFunctionConfig
{
    /** 返回值表达式 */
    return?: string;
    /** 函数体代码（可选，如果提供则使用此代码，否则使用 return） */
    body?: string;
}

/**
 * 类型映射：GLSL 类型到 WGSL 类型
 */
const typeMap: Record<string, string> = {
    float: 'f32',
    int: 'i32',
    uint: 'u32',
    bool: 'bool',
    vec2: 'vec2<f32>',
    vec3: 'vec3<f32>',
    vec4: 'vec4<f32>',
    ivec2: 'vec2<i32>',
    ivec3: 'vec3<i32>',
    ivec4: 'vec4<i32>',
    uvec2: 'vec2<u32>',
    uvec3: 'vec3<u32>',
    uvec4: 'vec4<u32>',
    bvec2: 'vec2<bool>',
    bvec3: 'vec3<bool>',
    bvec4: 'vec4<bool>',
    mat2: 'mat2x2<f32>',
    mat3: 'mat3x3<f32>',
    mat4: 'mat4x4<f32>',
};

/**
 * 将 GLSL 类型转换为 WGSL 类型
 */
function convertTypeToWGSL(glslType: string): string
{
    return typeMap[glslType] || glslType;
}

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

    // 生成 main 函数
    lines.push('void main() {');

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
        if (config.type === 'fragment')
        {
            lines.push(`    gl_FragColor = ${config.main.return};`);
        } else if (config.type === 'vertex')
        {
            lines.push(`    gl_Position = ${config.main.return};`);
        }
    }

    lines.push('}');

    return lines.join('\n') + '\n';
}

/**
 * 生成 WGSL 着色器代码
 */
export function generateWGSL(config: ShaderConfig): string
{
    const lines: string[] = [];

    // 生成 uniforms
    if (config.uniforms)
    {
        for (const uniform of config.uniforms)
        {
            const wgslType = convertTypeToWGSL(uniform.type);
            const binding = uniform.binding !== undefined ? `@binding(${uniform.binding})` : '';
            const group = uniform.group !== undefined ? `@group(${uniform.group})` : '';
            const annotations = [binding, group].filter(Boolean).join(' ');
            lines.push(`${annotations} var<uniform> ${uniform.name} : ${wgslType};`);
        }
    }

    // 生成 attributes（仅 vertex shader）
    if (config.type === 'vertex' && config.attributes)
    {
        // WGSL 中 attributes 是作为函数参数传入的
        // 这里先不处理，在 main 函数中处理
    }

    // 空行
    if (lines.length > 0)
    {
        lines.push('');
    }

    // 生成 main 函数
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
        lines.push(`fn main${paramStr} -> @builtin(position) vec4<f32> {`);

        if (config.main.body)
        {
            const bodyLines = config.main.body.split('\n');
            for (const line of bodyLines)
            {
                lines.push(`    ${line}`);
            }
        } else if (config.main.return)
        {
            lines.push(`    return ${config.main.return};`);
        }
    } else
    {
        // Fragment shader
        // 使用 vec4f 作为返回类型（vec4f 是 vec4<f32> 的别名）
        lines.push('fn main() -> @location(0) vec4f {');

        if (config.main.body)
        {
            const bodyLines = config.main.body.split('\n');
            for (const line of bodyLines)
            {
                lines.push(`    ${line}`);
            }
        } else if (config.main.return)
        {
            lines.push(`    return ${config.main.return};`);
        }
    }

    lines.push('}');

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

