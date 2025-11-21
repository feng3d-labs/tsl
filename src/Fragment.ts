import { getCurrentShaderInstance } from './currentShaderInstance';
import { Func } from './Func';
import type { FunctionCallConfig } from './builtin/vec4';

/**
 * Fragment 类，继承自 Func
 */
export class Fragment extends Func
{
    readonly shaderType = 'fragment' as const;

    constructor(name: string, body: () => any)
    {
        super(name, body, 'fragment');
    }

    /**
     * 转换为 GLSL 代码（fragment shader）
     */
    toGLSL(): string
    {
        return super.toGLSL('fragment');
    }

    /**
     * 转换为 WGSL 代码（fragment shader）
     */
    toWGSL(): string
    {
        return super.toWGSL('fragment');
    }
}

/**
 * 定义 Fragment Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Fragment 实例
 */
export function fragment(name: string, body: () => any): Fragment
{
    const def = new Fragment(name, body);

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

