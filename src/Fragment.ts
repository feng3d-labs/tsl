import { getCurrentShaderInstance } from './currentShaderInstance';
import { FUNC_SYMBOL, FuncDef } from './Vertex';

/**
 * Fragment Shader 函数定义对象接口
 */
export interface FragmentFuncDef extends FuncDef
{
    shaderType: 'fragment';
}

/**
 * 定义 Fragment Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Fragment 函数定义对象
 */
export function fragment(name: string, body: () => any): FragmentFuncDef
{
    const def: FragmentFuncDef = {
        __type__: FUNC_SYMBOL,
        name,
        body,
        shaderType: 'fragment',
    };

    // 如果当前正在构造 Shader 实例，自动添加到 fragments 字典
    const currentShaderInstance = getCurrentShaderInstance();
    if (currentShaderInstance && currentShaderInstance.fragments)
    {
        if (currentShaderInstance.fragments[name])
        {
            throw new Error(`Fragment 函数 '${name}' 已经定义过了，不能重复定义。`);
        }
        currentShaderInstance.fragments[name] = def;
    }

    return def;
}

