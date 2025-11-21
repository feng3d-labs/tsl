import { classToShaderConfig } from './classToShader';
import { IShader } from './IShader';
import { generateMainGLSL, generateMainWGSL } from './main';
import { AttributeDef, FragmentFuncDef, UniformDef, VertexFuncDef, setCurrentShaderInstance, clearCurrentShaderInstance } from './shaderHelpers';
import { generateUniformsWGSL } from './uniforms';

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
    public attributes: Record<string, AttributeDef> = {};

    /**
     * Uniforms 字典（以变量名为 key）
     */
    public uniforms: Record<string, UniformDef> = {};

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
     * 添加 uniform 定义（由 uniform() 函数调用）
     * @internal
     */
    _addUniform(def: UniformDef): void
    {
        this.uniforms[def.name] = def;
    }

    /**
     * 添加 attribute 定义（由 attribute() 函数调用）
     * @internal
     */
    _addAttribute(def: AttributeDef): void
    {
        this.attributes[def.name] = def;
    }

    /**
     * 添加 vertex 函数定义（由 vertex() 函数调用）
     * @internal
     */
    _addVertex(def: VertexFuncDef): void
    {
        this.vertexs[def.name] = def;
    }

    /**
     * 添加 fragment 函数定义（由 fragment() 函数调用）
     * @internal
     */
    _addFragment(def: FragmentFuncDef): void
    {
        this.fragments[def.name] = def;
    }

    /**
     * 生成 GLSL 着色器代码
     * @param shaderType 着色器类型，必须提供：'vertex' 或 'fragment'
     * @param entry 入口函数名（可选）。如果提供则查找同名同类型的入口函数，否则取第一个入口函数
     */
    generateGLSL(shaderType: 'vertex' | 'fragment', entry?: string): string
    {
        const config = classToShaderConfig(this as any, shaderType, entry);
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
     * @param shaderType 着色器类型，必须提供：'vertex' 或 'fragment'
     * @param entry 入口函数名（可选）。如果提供则查找同名同类型的入口函数，否则取第一个入口函数
     */
    generateWGSL(shaderType: 'vertex' | 'fragment', entry?: string): string
    {
        const config = classToShaderConfig(this as any, shaderType, entry);
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


