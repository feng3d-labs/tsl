import { ShaderConfig, AttributeConfig } from './shaderGenerator';
import { UniformConfig } from './uniforms';
import { MainFunctionConfig } from './main';
import { isUniformDef, isAttributeDef, uniformDefToConfig, attributeDefToConfig, isFuncDef, FuncDef } from './shaderHelpers';

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
        main: (() => any) | FuncDef;
        [key: string]: any;
    },
    entry: string = 'main'
): ShaderConfig
{
    // 从入口函数中获取着色器类型
    let shaderType: 'vertex' | 'fragment' = 'fragment'; // 默认值
    
    // 查找入口函数
    let entryFunc: (() => any) | FuncDef | undefined = undefined;
    
    if (entry === 'main' && instance.main)
    {
        entryFunc = instance.main;
    }
    else if (entry !== 'main' && instance[entry])
    {
        const funcValue = instance[entry];
        if (isFuncDef(funcValue) || typeof funcValue === 'function')
        {
            entryFunc = funcValue;
        }
    }
    
    // 如果入口函数是 FuncDef 且有 shaderType，使用它
    if (entryFunc && isFuncDef(entryFunc) && entryFunc.shaderType)
    {
        shaderType = entryFunc.shaderType;
    }
    
    // 获取实际的函数名（从 FuncDef 中获取，默认为 'main'）
    let entryName = 'main';
    if (entryFunc && isFuncDef(entryFunc))
    {
        entryName = entryFunc.name;
    }
    
    const config: ShaderConfig = {
        type: shaderType,
        main: {} as MainFunctionConfig,
        entryName,
    };

    // 设置 precision（仅用于 fragment shader）
    if (shaderType === 'fragment' && instance.precision)
    {
        config.precision = instance.precision;
    }

    // 收集通过 uniform() 和 attribute() 定义的变量
    const uniforms: UniformConfig[] = [];
    const attributes: AttributeConfig[] = [];

    // 遍历实例的所有属性
    for (const key in instance)
    {
        // 跳过特殊属性
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
        // 跳过函数定义（func() 定义的对象）
        else if (isFuncDef(value))
        {
            continue;
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

    // 处理入口函数（entryFunc 已经在上面查找过了）
    if (entryFunc)
    {
        // 检查是否为通过 func() 定义的函数
        if (isFuncDef(entryFunc))
        {
            // 执行函数体并获取返回值
            try
            {
                const returnValue = entryFunc.body.call(instance);
                
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
                        config.main.return = strValue;
                    }
                }
                else
                {
                    // 如果没有返回值，输出警告
                    console.warn(`Entry function '${entry}' returned undefined or null`);
                }
            } catch (error)
            {
                // 如果函数体执行失败，输出错误信息
                console.error('Failed to execute main function body:', error);
                throw error;
            }
        }
        // 否则，是普通方法
        else if (typeof entryFunc === 'function')
        {
            try
            {
                const returnValue = entryFunc.call(instance);
            
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
                        config.main.return = strValue;
                    }
                }
            } catch (error)
            {
                // 如果 main 方法执行失败，可能需要使用 body 方式
                console.warn('Failed to execute main() method, consider using body property instead', error);
            }
        }
    }

    return config;
}

