import { Attribute } from './Attribute';
import { Fragment } from './Fragment';
import { IShader } from './IShader';
import { Uniform } from './Uniform';
import { Vertex } from './Vertex';
import { clearCurrentShaderInstance, setCurrentShaderInstance } from './currentShaderInstance';

/**
 * Shader 基类
 * 提供通用的代码生成方法
 */
export class Shader implements IShader
{
    /**
     * GLSL 精度声明（仅用于 fragment shader）
     */
    precision: 'lowp' | 'mediump' | 'highp';

    /**
     * Vertex 函数字典（以函数名为 key）
     */
    public vertexs: Record<string, Vertex> = {};

    /**
     * Fragment 函数字典（以函数名为 key）
     */
    public fragments: Record<string, Fragment> = {};

    /**
     * 构造函数
     */
    constructor()
    {
    }

    /**
     * 分析函数依赖中使用的 attributes 和 uniforms
     * @param dependencies 函数依赖数组
     * @returns 使用的 Attribute 和 Uniform 实例集合
     */
    private analyzeDependencies(dependencies: any[]): { attributes: Set<Attribute>; uniforms: Set<Uniform> }
    {
        const attributes = new Set<Attribute>();
        const uniforms = new Set<Uniform>();
        const visited = new WeakSet();

        const analyzeValue = (value: any): void =>
        {
            if (value === null || value === undefined)
            {
                return;
            }

            // 避免重复访问同一个对象
            if (typeof value === 'object' && visited.has(value))
            {
                return;
            }
            if (typeof value === 'object')
            {
                visited.add(value);
            }

            // 如果是 Uniform 或 Attribute 实例，直接添加
            if (value instanceof Uniform)
            {
                uniforms.add(value);

                return;
            }

            if (value instanceof Attribute)
            {
                attributes.add(value);

                return;
            }

            // 如果是 IElement 实例（Vec2, Vec4 等），分析其 dependencies
            if (typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies))
            {
                for (const dep of value.dependencies)
                {
                    analyzeValue(dep);
                }
            }
        };

        // 分析所有依赖
        for (const dep of dependencies)
        {
            analyzeValue(dep);
        }

        return { attributes, uniforms };
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
        let entryFunc: Vertex | Fragment | undefined;

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

        // 先执行 body 收集依赖（通过调用 toGLSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        entryFunc.toGLSL();

        // 从函数的 dependencies 中分析获取 attributes 和 uniforms
        const dependencies = this.analyzeDependencies(entryFunc.dependencies);

        // 生成 attributes（仅 vertex shader，且只包含实际使用的）
        if (shaderType === 'vertex')
        {
            for (const attr of dependencies.attributes)
            {
                lines.push(attr.toGLSL());
            }
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toGLSL());
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 使用 entryFunc 生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = entryFunc.toGLSL();
        lines.push(...funcCode.split('\n'));

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
        let entryFunc: Vertex | Fragment | undefined;

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

        // 先执行 body 收集依赖（通过调用 toWGSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        entryFunc.toWGSL();

        // 从函数的 dependencies 中分析获取 attributes 和 uniforms
        const dependencies = this.analyzeDependencies(entryFunc.dependencies);

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toWGSL());
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 准备 attributes 配置（仅用于 vertex shader，且只包含实际使用的）
        const attributes = shaderType === 'vertex'
            ? Array.from(dependencies.attributes)
            : undefined;

        // 使用 entryFunc 生成函数代码（不会再次执行 body，因为依赖已收集）
        let funcCode: string;
        if (entryFunc instanceof Vertex)
        {
            funcCode = entryFunc.toWGSL(attributes);
        }
        else
        {
            funcCode = entryFunc.toWGSL();
        }
        lines.push(...funcCode.split('\n'));

        return lines.join('\n') + '\n';
    }

}

/**
 * 定义着色器（函数式方式）
 * @param name 着色器名称
 * @param builder 构建函数，在其中定义 vertex 和 fragment 函数
 * @returns Shader 实例
 */
export function shader(name: string, builder: () => void): Shader
{
    // 创建 Shader 实例
    const shaderInstance = new Shader();

    // 设置当前 Shader 实例，以便 vertex 和 fragment 函数可以自动收集
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

