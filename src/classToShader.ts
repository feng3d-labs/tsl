import { ShaderConfig, AttributeConfig } from './shaderGenerator';
import { UniformConfig } from './uniforms';
import { MainFunctionConfig } from './main';

/**
 * 从类实例的 uniforms 对象转换为 UniformConfig 数组
 */
export function convertUniformsToConfig(uniforms: Record<string, { type: string; binding?: number; group?: number }>): UniformConfig[]
{
    const config: UniformConfig[] = [];

    for (const [name, uniform] of Object.entries(uniforms))
    {
        config.push({
            name,
            type: uniform.type,
            binding: uniform.binding,
            group: uniform.group,
        });
    }

    return config;
}

/**
 * 从类实例的 attributes 对象转换为 AttributeConfig 数组
 */
export function convertAttributesToConfig(attributes: Record<string, { type: string; location?: number }>): AttributeConfig[]
{
    const config: AttributeConfig[] = [];

    for (const [name, attr] of Object.entries(attributes))
    {
        config.push({
            name,
            type: attr.type,
            location: attr.location,
        });
    }

    return config;
}

/**
 * 从着色器类实例转换为 ShaderConfig
 */
export function classToShaderConfig(
    instance: {
        precision?: 'lowp' | 'mediump' | 'highp';
        uniforms?: Record<string, { type: string; binding?: number; group?: number }>;
        attributes?: Record<string, { type: string; location?: number }>;
        main: () => any;
    },
    type: 'vertex' | 'fragment'
): ShaderConfig
{
    const config: ShaderConfig = {
        type,
        main: {} as MainFunctionConfig,
    };

    // 设置 precision（仅用于 fragment shader）
    if (type === 'fragment' && instance.precision)
    {
        config.precision = instance.precision;
    }

    // 转换 uniforms
    if (instance.uniforms)
    {
        config.uniforms = convertUniformsToConfig(instance.uniforms);
    }

    // 转换 attributes（主要用于 vertex shader）
    if (instance.attributes)
    {
        config.attributes = convertAttributesToConfig(instance.attributes);
    }

    // 处理 main 函数的返回值
    try
    {
        const returnValue = instance.main();
        
        if (returnValue !== undefined && returnValue !== null)
        {
            // 如果返回值是字符串，直接使用
            if (typeof returnValue === 'string')
            {
                config.main.return = returnValue;
            }
            // 如果返回值是对象，可能是函数调用配置
            else if (typeof returnValue === 'object' && 'function' in returnValue)
            {
                config.main.return = returnValue as any;
            }
            // 其他情况，尝试转换为字符串
            else
            {
                config.main.return = String(returnValue);
            }
        }
    } catch (error)
    {
        // 如果 main 方法执行失败，可能需要使用 body 方式
        console.warn('Failed to execute main() method, consider using body property instead', error);
    }

    return config;
}

