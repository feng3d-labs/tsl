import { IShader } from './IShader';
import { MainFunctionConfig } from './main';
import { ShaderConfig } from './shaderGenerator';
import type { FragmentFuncDef, VertexFuncDef } from './shaderHelpers';
import { attribute, Attribute, attributeDefToConfig, clearCurrentShaderInstance, fragment, isAttributeDef, isUniformDef, setCurrentShaderInstance, uniform, Uniform, uniformDefToConfig, vertex } from './shaderHelpers';
import { generateUniformsWGSL, UniformConfig } from './uniforms';
import { convertTypeToWGSL, FunctionCallConfig, generateFunctionCallGLSL, generateFunctionCallWGSL } from './vec4';

/**
 * Shader 基类
 * 提供通用的代码生成方法
 */
export class Shader implements IShader
{
    /**
     * GLSL 精度声明（仅用于 fragment shader）
     */
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    /**
     * Attributes 字典（以变量名为 key）
     */
    public attributes: Record<string, Attribute> = {};

    /**
     * Uniforms 字典（以变量名为 key）
     */
    public uniforms: Record<string, Uniform> = {};

    /**
     * Vertex 函数字典（以函数名为 key）
     */
    public vertexs: Record<string, VertexFuncDef> = {};

    /**
     * Fragment 函数字典（以函数名为 key）
     */
    public fragments: Record<string, FragmentFuncDef> = {};

    /**
     * 构造函数
     */
    constructor()
    {
    }


    /**
     * 生成 GLSL 着色器代码
     * @param shaderType 着色器类型，必须提供：'vertex' 或 'fragment'
     * @param entry 入口函数名（可选）。如果提供则查找同名同类型的入口函数，否则取第一个入口函数
     */
    generateGLSL(shaderType: 'vertex' | 'fragment', entry?: string): string
    {
        const lines: string[] = [];

        // 查找入口函数
        const funcDict = shaderType === 'vertex' ? this.vertexs : this.fragments;
        let entryFunc: VertexFuncDef | FragmentFuncDef | undefined;

        if (entry)
        {
            entryFunc = funcDict[entry];
        }
        else
        {
            const keys = Object.keys(funcDict);
            if (keys.length > 0)
            {
                entryFunc = funcDict[keys[0]];
            }
        }

        if (!entryFunc)
        {
            const entryDesc = entry ? `名为 '${entry}' 的` : '';
            const shaderTypeDesc = shaderType === 'vertex' ? '顶点' : '片段';
            throw new Error(`未找到${shaderTypeDesc}着色器的${entryDesc}入口函数。请确保已定义 ${shaderType === 'vertex' ? 'vertex' : 'fragment'}() 函数${entry ? `，且函数名为 '${entry}'` : ''}。`);
        }

        const functionName = entryFunc.name;

        // Fragment shader 需要 precision 声明
        if (shaderType === 'fragment' && this.precision)
        {
            lines.push(`precision ${this.precision} float;`);
        }

        // 生成 attributes（仅 vertex shader）
        if (shaderType === 'vertex')
        {
            const attrKeys = Object.keys(this.attributes);
            for (const key of attrKeys)
            {
                const attr = this.attributes[key];
                lines.push(attr.toGLSL());
            }
        }

        // 生成 uniforms
        const uniformKeys = Object.keys(this.uniforms);
        if (uniformKeys.length > 0)
        {
            for (const key of uniformKeys)
            {
                const uniform = this.uniforms[key];
                lines.push(uniform.toGLSL());
            }
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = entryFunc.body();
        }
        catch (error)
        {
            throw new Error(`执行入口函数 '${functionName}' 时出错: ${error}`);
        }

        // 生成入口函数
        lines.push(`void ${functionName}() {`);

        if (returnValue !== undefined && returnValue !== null)
        {
            let glslReturn: string;

            if (typeof returnValue === 'string')
            {
                glslReturn = returnValue.replace(/<f32>/g, '').replace(/<i32>/g, '').replace(/<u32>/g, '');
            }
            else if (typeof returnValue === 'object' && 'function' in returnValue)
            {
                glslReturn = generateFunctionCallGLSL(returnValue as FunctionCallConfig);
            }
            else if (isUniformDef(returnValue) || isAttributeDef(returnValue))
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

        return lines.join('\n') + '\n';
    }

    /**
     * 生成 WGSL 着色器代码
     * @param shaderType 着色器类型，必须提供：'vertex' 或 'fragment'
     * @param entry 入口函数名（可选）。如果提供则查找同名同类型的入口函数，否则取第一个入口函数
     */
    generateWGSL(shaderType: 'vertex' | 'fragment', entry?: string): string
    {
        const lines: string[] = [];

        // 查找入口函数
        const funcDict = shaderType === 'vertex' ? this.vertexs : this.fragments;
        let entryFunc: VertexFuncDef | FragmentFuncDef | undefined;

        if (entry)
        {
            entryFunc = funcDict[entry];
        }
        else
        {
            const keys = Object.keys(funcDict);
            if (keys.length > 0)
            {
                entryFunc = funcDict[keys[0]];
            }
        }

        if (!entryFunc)
        {
            const entryDesc = entry ? `名为 '${entry}' 的` : '';
            const shaderTypeDesc = shaderType === 'vertex' ? '顶点' : '片段';
            throw new Error(`未找到${shaderTypeDesc}着色器的${entryDesc}入口函数。请确保已定义 ${shaderType === 'vertex' ? 'vertex' : 'fragment'}() 函数${entry ? `，且函数名为 '${entry}'` : ''}。`);
        }

        const functionName = entryFunc.name;

        // 生成 uniforms
        const uniformKeys = Object.keys(this.uniforms);
        if (uniformKeys.length > 0)
        {
            const uniformConfigs: UniformConfig[] = [];
            for (const key of uniformKeys)
            {
                const uniform = this.uniforms[key];
                uniformConfigs.push(uniform.toConfig());
            }
            lines.push(...generateUniformsWGSL(uniformConfigs));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = entryFunc.body();
        }
        catch (error)
        {
            throw new Error(`执行入口函数 '${functionName}' 时出错: ${error}`);
        }

        // 生成入口函数
        const stage = shaderType === 'vertex' ? '@vertex' : '@fragment';
        lines.push(stage);

        if (shaderType === 'vertex')
        {
            // Vertex shader
            const params: string[] = [];
            const attrKeys = Object.keys(this.attributes);
            for (const key of attrKeys)
            {
                const attr = this.attributes[key];
                params.push(attr.toWGSL());
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
            lines.push(`fn ${functionName}${paramStr} -> @builtin(position) vec4<f32> {`);

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
                else if (isUniformDef(returnValue) || isAttributeDef(returnValue))
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
            lines.push(`fn ${functionName}() -> @location(0) vec4f {`);

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
                else if (isUniformDef(returnValue) || isAttributeDef(returnValue))
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

        return lines.join('\n') + '\n';
    }

    /**
     * 将 Shader 序列化为 ShaderConfig（用于指定类型的着色器）
     * @param shaderType 着色器类型，必须提供：'vertex' 或 'fragment'
     * @param entry 入口函数名（可选）。如果提供则查找同名同类型的入口函数，否则取第一个入口函数
     * @returns ShaderConfig 对象
     */
    toConfig(shaderType: 'vertex' | 'fragment', entry?: string): ShaderConfig
    {
        // 查找入口函数
        const funcDict = shaderType === 'vertex' ? this.vertexs : this.fragments;
        let entryFunc: VertexFuncDef | FragmentFuncDef | undefined;

        if (entry)
        {
            entryFunc = funcDict[entry];
        }
        else
        {
            const keys = Object.keys(funcDict);
            if (keys.length > 0)
            {
                entryFunc = funcDict[keys[0]];
            }
        }

        if (!entryFunc)
        {
            const entryDesc = entry ? `名为 '${entry}' 的` : '';
            const shaderTypeDesc = shaderType === 'vertex' ? '顶点' : '片段';
            throw new Error(`未找到${shaderTypeDesc}着色器的${entryDesc}入口函数。请确保已定义 ${shaderType === 'vertex' ? 'vertex' : 'fragment'}() 函数${entry ? `，且函数名为 '${entry}'` : ''}。`);
        }

        const functionName = entryFunc.name;

        // 执行函数体获取返回值
        let returnValue: any;
        try
        {
            returnValue = entryFunc.body();
        }
        catch (error)
        {
            throw new Error(`执行入口函数 '${functionName}' 时出错: ${error}`);
        }

        // 构建 MainFunctionConfig
        const main: MainFunctionConfig = {};
        if (returnValue !== undefined && returnValue !== null)
        {
            if (typeof returnValue === 'string')
            {
                main.return = returnValue;
            }
            else if (typeof returnValue === 'object' && 'function' in returnValue)
            {
                main.return = returnValue as FunctionCallConfig;
            }
            else if (isUniformDef(returnValue) || isAttributeDef(returnValue))
            {
                main.return = returnValue.name;
            }
            else
            {
                main.return = String(returnValue);
            }
        }

        // 构建 ShaderConfig
        const config: ShaderConfig = {
            type: shaderType,
            main,
            entryName: functionName,
        };

        // 设置 precision（仅用于 fragment shader）
        if (shaderType === 'fragment' && this.precision)
        {
            config.precision = this.precision;
        }

        // 收集 uniforms
        const uniformKeys = Object.keys(this.uniforms);
        if (uniformKeys.length > 0)
        {
            config.uniforms = uniformKeys.map(key => uniformDefToConfig(this.uniforms[key]));
        }

        // 收集 attributes（仅用于 vertex shader）
        if (shaderType === 'vertex')
        {
            const attrKeys = Object.keys(this.attributes);
            if (attrKeys.length > 0)
            {
                config.attributes = attrKeys.map(key => attributeDefToConfig(this.attributes[key]));
            }
        }

        return config;
    }

    /**
     * 从 ShaderConfig 创建 Shader 实例（反序列化）
     * @param config ShaderConfig 对象
     * @returns Shader 实例
     */
    static fromConfig(config: ShaderConfig): Shader
    {
        const shaderInstance = new Shader();

        // 设置 precision
        if (config.precision)
        {
            shaderInstance.precision = config.precision as 'lowp' | 'mediump' | 'highp';
        }

        // 设置 uniforms（通过 uniform() 函数创建，以确保正确的 Symbol）
        if (config.uniforms)
        {
            for (const uniformConfig of config.uniforms)
            {
                const uniformDef = uniform(uniformConfig.name, uniformConfig.type, uniformConfig.binding, uniformConfig.group);
                shaderInstance.uniforms[uniformConfig.name] = uniformDef;
            }
        }

        // 设置 attributes（通过 attribute() 函数创建，以确保正确的 Symbol）
        if (config.attributes)
        {
            for (const attrConfig of config.attributes)
            {
                const attrDef = attribute(attrConfig.name, attrConfig.type, attrConfig.location);
                shaderInstance.attributes[attrConfig.name] = attrDef;
            }
        }

        // 设置入口函数（通过 vertex() 或 fragment() 函数创建，以确保正确的 Symbol）
        const entryName = config.entryName || 'main';
        const funcBody = () => config.main.return;

        if (config.type === 'vertex')
        {
            const vertexFunc = vertex(entryName, funcBody);
            shaderInstance.vertexs[entryName] = vertexFunc;
        }
        else if (config.type === 'fragment')
        {
            const fragmentFunc = fragment(entryName, funcBody);
            shaderInstance.fragments[entryName] = fragmentFunc;
        }

        return shaderInstance;
    }
}

/**
 * 定义着色器（函数式方式）
 * @param name 着色器名称
 * @param builder 构建函数，在其中定义 attributes、uniforms、vertex 和 fragment 函数
 * @returns Shader 实例
 */
export function shader(name: string, builder: () => void): Shader
{
    // 创建 Shader 实例
    const shaderInstance = new Shader();

    // 设置当前 Shader 实例，以便 attribute、uniform 等函数可以自动收集
    setCurrentShaderInstance(shaderInstance);

    // 执行构建函数
    try
    {
        builder();
    }
    finally
    {
        // 清除当前实例引用
        clearCurrentShaderInstance();
    }

    return shaderInstance;
}


