import { ShaderConfig, AttributeConfig } from './shaderGenerator';
import { UniformConfig } from './uniforms';
import { MainFunctionConfig } from './main';
import { isUniformDef, isAttributeDef, uniformDefToConfig, attributeDefToConfig } from './shaderHelpers';

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
        [key: string]: any;
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

    // 收集通过 uniform() 和 attribute() 定义的变量
    const uniforms: UniformConfig[] = [];
    const attributes: AttributeConfig[] = [];

    // 遍历实例的所有属性
    for (const key in instance)
    {
        if (key === 'precision' || key === 'uniforms' || key === 'attributes' || key === 'main' || key === 'generateGLSL' || key === 'generateWGSL')
        {
            continue;
        }

        const value = instance[key];

        // 检查是否为 uniform 定义
        if (isUniformDef(value))
        {
            uniforms.push(uniformDefToConfig(value));
        }
        // 检查是否为 attribute 定义
        else if (isAttributeDef(value))
        {
            attributes.push(attributeDefToConfig(value));
        }
    }

    // 如果存在通过 uniform() 定义的变量，使用它们
    if (uniforms.length > 0)
    {
        config.uniforms = uniforms;
    }
    // 否则，尝试使用旧的 uniforms 对象格式
    else if (instance.uniforms)
    {
        config.uniforms = convertUniformsToConfig(instance.uniforms);
    }

    // 如果存在通过 attribute() 定义的变量，使用它们
    if (attributes.length > 0)
    {
        config.attributes = attributes;
    }
    // 否则，尝试使用旧的 attributes 对象格式
    else if (instance.attributes)
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
            // 如果返回值是 uniform 或 attribute 定义对象，提取变量名
            else if (isUniformDef(returnValue) || isAttributeDef(returnValue))
            {
                config.main.return = returnValue.name;
            }
            // 其他情况，尝试转换为字符串（uniform/attribute 对象会通过 toString 返回变量名）
            else
            {
                const strValue = String(returnValue);
                // 如果转换后的字符串看起来像变量名（不包含特殊字符），使用它
                if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(strValue))
                {
                    config.main.return = strValue;
                }
                else
                {
                    config.main.return = strValue;
                }
            }
        }
    } catch (error)
    {
        // 如果 main 方法执行失败，可能需要使用 body 方式
        console.warn('Failed to execute main() method, consider using body property instead', error);
    }

    return config;
}

