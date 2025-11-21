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
        main?: (() => any) | FuncDef;
        vertexs?: any[];
        fragments?: any[];
        [key: string]: any;
    },
    shaderType: 'vertex' | 'fragment',
    entry?: string
): ShaderConfig
{
    // 查找入口函数
    let entryFunc: (() => any) | FuncDef | undefined = undefined;
    
    // 根据 shaderType 在对应的字典中查找
    if (shaderType === 'vertex' && instance.vertexs && typeof instance.vertexs === 'object' && !Array.isArray(instance.vertexs))
    {
        if (entry)
        {
            // 如果提供了 entry，直接通过 key 查找
            entryFunc = instance.vertexs[entry];
        }
        else
        {
            // 如果没有提供 entry，取第一个函数
            const keys = Object.keys(instance.vertexs);
            if (keys.length > 0)
            {
                entryFunc = instance.vertexs[keys[0]];
            }
        }
    }
    else if (shaderType === 'fragment' && instance.fragments && typeof instance.fragments === 'object' && !Array.isArray(instance.fragments))
    {
        if (entry)
        {
            // 如果提供了 entry，直接通过 key 查找
            entryFunc = instance.fragments[entry];
        }
        else
        {
            // 如果没有提供 entry，取第一个函数
            const keys = Object.keys(instance.fragments);
            if (keys.length > 0)
            {
                entryFunc = instance.fragments[keys[0]];
            }
        }
    }
    
    // 如果没找到，尝试从实例属性中查找（兼容旧方式）
    if (!entryFunc)
    {
        const searchEntry = entry || 'main';
        if (searchEntry === 'main' && instance.main)
        {
            entryFunc = instance.main;
        }
        else if (searchEntry !== 'main' && instance[searchEntry])
        {
            const funcValue = instance[searchEntry];
            if (isFuncDef(funcValue) || typeof funcValue === 'function')
            {
                entryFunc = funcValue;
            }
        }
    }
    
    // 如果入口函数是 FuncDef 且有 shaderType，使用它（优先级最高）
    if (entryFunc && isFuncDef(entryFunc) && entryFunc.shaderType)
    {
        shaderType = entryFunc.shaderType;
    }
    
    // 如果没有找到入口函数，抛出错误
    if (!entryFunc)
    {
        const entryDesc = entry ? `名为 '${entry}' 的` : '';
        const shaderTypeDesc = shaderType === 'vertex' ? '顶点' : '片段';
        throw new Error(`未找到${shaderTypeDesc}着色器的${entryDesc}入口函数。请确保已定义 ${shaderType === 'vertex' ? 'vertex' : 'fragment'}() 函数${entry ? `，且函数名为 '${entry}'` : ''}。`);
    }
    
    // 获取实际的函数名（从 FuncDef 中获取，默认为 'main'）
    let entryName = entry || 'main';
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

    // 优先使用字典形式的 uniforms 和 attributes
    if (instance.uniforms && typeof instance.uniforms === 'object' && !Array.isArray(instance.uniforms))
    {
        // 从字典中收集所有 uniform 定义
        for (const key in instance.uniforms)
        {
            const def = instance.uniforms[key];
            if (isUniformDef(def))
            {
                uniforms.push(uniformDefToConfig(def));
            }
        }
    }
    else
    {
        // 遍历实例的所有属性（兼容旧方式）
        for (const key in instance)
        {
            // 跳过特殊属性
            if (key === 'precision' || key === 'uniforms' || key === 'attributes' || key === 'vertexs' || key === 'fragments' || key === 'main' || key === 'generateGLSL' || key === 'generateWGSL')
            {
                continue;
            }

            const value = instance[key];

            // 检查是否为 uniform 定义
            if (isUniformDef(value))
            {
                uniforms.push(uniformDefToConfig(value));
            }
        }
    }

    if (instance.attributes && typeof instance.attributes === 'object' && !Array.isArray(instance.attributes))
    {
        // 从字典中收集所有 attribute 定义
        for (const key in instance.attributes)
        {
            const def = instance.attributes[key];
            if (isAttributeDef(def))
            {
                attributes.push(attributeDefToConfig(def));
            }
        }
    }
    else
    {
        // 遍历实例的所有属性（兼容旧方式）
        for (const key in instance)
        {
            // 跳过特殊属性
            if (key === 'precision' || key === 'uniforms' || key === 'attributes' || key === 'vertexs' || key === 'fragments' || key === 'main' || key === 'generateGLSL' || key === 'generateWGSL')
            {
                continue;
            }

            const value = instance[key];

            // 检查是否为 attribute 定义
            if (isAttributeDef(value))
            {
                attributes.push(attributeDefToConfig(value));
            }
        }
    }

    // 如果存在通过 uniform() 定义的变量，使用它们
    if (uniforms.length > 0)
    {
        config.uniforms = uniforms;
    }
    // 否则，尝试使用旧的 uniforms 对象格式
    else if (instance.uniforms && typeof instance.uniforms === 'object')
    {
        config.uniforms = convertUniformsToConfig(instance.uniforms);
    }

    // 如果存在通过 attribute() 定义的变量，使用它们
    if (attributes.length > 0)
    {
        config.attributes = attributes;
    }
    // 否则，尝试使用旧的 attributes 对象格式
    else if (instance.attributes && typeof instance.attributes === 'object')
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

