import { classToShaderConfig } from './classToShader';
import { generateMainGLSL, generateMainWGSL } from './main';
import { AttributeDef, FragmentFuncDef, UniformDef, VertexFuncDef, isUniformDef, isAttributeDef, isFuncDef, setCurrentShaderInstance, clearCurrentShaderInstance } from './shaderHelpers';
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

    private _attributes: AttributeDef[] | null = null;
    private _uniforms: UniformDef[] | null = null;
    private _vertexs: VertexFuncDef[] | null = null;
    private _fragments: FragmentFuncDef[] | null = null;

    /**
     * 构造函数：设置当前 Shader 实例，以便 attribute、uniform 等函数自动收集
     */
    constructor()
    {
        // 初始化列表
        this._attributes = [];
        this._uniforms = [];
        this._vertexs = [];
        this._fragments = [];

        // 设置当前 Shader 实例，以便 attribute、uniform 等函数可以自动收集
        // 注意：类字段初始化在构造函数之前完成，所以我们需要在构造函数中遍历已初始化的属性
        setCurrentShaderInstance(this);

        // 遍历已初始化的属性，收集 definitions
        for (const key in this)
        {
            // 跳过特殊属性
            if (key === 'precision' || key === '_attributes' || key === '_uniforms' || key === '_vertexs' || key === '_fragments' || key === 'attributes' || key === 'uniforms' || key === 'vertexs' || key === 'fragments' || key === 'generateGLSL' || key === 'generateWGSL')
            {
                continue;
            }

            const value = (this as any)[key];

            // 检查是否为 uniform 定义
            if (isUniformDef(value))
            {
                this._addUniform(value);
            }
            // 检查是否为 attribute 定义
            else if (isAttributeDef(value))
            {
                this._addAttribute(value);
            }
            // 检查是否为函数定义
            else if (isFuncDef(value))
            {
                if (value.shaderType === 'vertex')
                {
                    this._addVertex(value as VertexFuncDef);
                }
                else if (value.shaderType === 'fragment')
                {
                    this._addFragment(value as FragmentFuncDef);
                }
            }
        }

        // 清除当前实例引用
        clearCurrentShaderInstance();
    }

    /**
     * 添加 uniform 定义（由 uniform() 函数调用）
     * @internal
     */
    _addUniform(def: UniformDef): void
    {
        if (!this._uniforms)
        {
            this._uniforms = [];
        }
        this._uniforms.push(def);
    }

    /**
     * 添加 attribute 定义（由 attribute() 函数调用）
     * @internal
     */
    _addAttribute(def: AttributeDef): void
    {
        if (!this._attributes)
        {
            this._attributes = [];
        }
        this._attributes.push(def);
    }

    /**
     * 添加 vertex 函数定义（由 vertex() 函数调用）
     * @internal
     */
    _addVertex(def: VertexFuncDef): void
    {
        if (!this._vertexs)
        {
            this._vertexs = [];
        }
        this._vertexs.push(def);
    }

    /**
     * 添加 fragment 函数定义（由 fragment() 函数调用）
     * @internal
     */
    _addFragment(def: FragmentFuncDef): void
    {
        if (!this._fragments)
        {
            this._fragments = [];
        }
        this._fragments.push(def);
    }

    /**
     * Attributes 列表
     */
    get attributes(): AttributeDef[]
    {
        return this._attributes || [];
    }

    /**
     * Uniforms 列表
     */
    get uniforms(): UniformDef[]
    {
        return this._uniforms || [];
    }

    /**
     * Vertex 函数列表
     */
    get vertexs(): VertexFuncDef[]
    {
        return this._vertexs || [];
    }

    /**
     * Fragment 函数列表
     */
    get fragments(): FragmentFuncDef[]
    {
        return this._fragments || [];
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

    // 将收集到的 vertex 和 fragment 函数也赋值给实例属性，以便 classToShaderConfig 可以找到它们
    if (shaderInstance.vertexs.length > 0)
    {
        (shaderInstance as any).vertex = shaderInstance.vertexs[0];
    }
    if (shaderInstance.fragments.length > 0)
    {
        (shaderInstance as any).fragment = shaderInstance.fragments[0];
    }

    return shaderInstance;
}


