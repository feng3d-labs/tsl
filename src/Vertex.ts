import { getCurrentShaderInstance } from './currentShaderInstance';
import { Func, FUNC_SYMBOL } from './Func';
import type { FunctionCallConfig } from './builtin/vec4';

// 重新导出 FUNC_SYMBOL 以便向后兼容
export { FUNC_SYMBOL };

/**
 * Vertex 类，继承自 Func
 */
export class Vertex extends Func
{
    readonly shaderType = 'vertex' as const;

    constructor(name: string, body: () => any)
    {
        super(name, body, 'vertex');
    }

    /**
     * 转换为 GLSL 代码（vertex shader）
     */
    toGLSL(): string
    {
        return super.toGLSL('vertex');
    }

    /**
     * 转换为 WGSL 代码（vertex shader）
     * @param shaderType 着色器类型（忽略，固定为 'vertex'）
     * @param attributes 属性列表
     */
    toWGSL(shaderType?: 'vertex' | 'fragment', attributes?: Array<{ name: string; type: string; location?: number }>): string
    {
        return super.toWGSL('vertex', attributes);
    }
}

/**
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Vertex 实例
 */
export function vertex(name: string, body: () => any): Vertex
{
    const def = new Vertex(name, body);

    // 如果当前正在构造 Shader 实例，自动添加到 vertexs 字典
    const currentShaderInstance = getCurrentShaderInstance();
    if (currentShaderInstance && currentShaderInstance.vertexs)
    {
        if (currentShaderInstance.vertexs[name])
        {
            throw new Error(`Vertex 函数 '${name}' 已经定义过了，不能重复定义。`);
        }
        currentShaderInstance.vertexs[name] = def;
    }

    return def;
}

