import { getCurrentShaderInstance } from './currentShaderInstance';

/**
 * 函数定义标记
 */
export const FUNC_SYMBOL = Symbol('func');

/**
 * 函数定义对象接口（通用函数，不指定着色器类型）
 */
export interface FuncDef
{
    __type__: typeof FUNC_SYMBOL;
    name: string;
    body: () => any;
    shaderType?: 'vertex' | 'fragment';
}

/**
 * Vertex Shader 函数定义对象接口
 */
export interface VertexFuncDef extends FuncDef
{
    shaderType: 'vertex';
}

/**
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Vertex 函数定义对象
 */
export function vertex(name: string, body: () => any): VertexFuncDef
{
    const def: VertexFuncDef = {
        __type__: FUNC_SYMBOL,
        name,
        body,
        shaderType: 'vertex',
    };

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

