import { Func } from './Func';

/**
 * Fragment 类，继承自 Func
 */
export class Fragment extends Func
{
    constructor(name: string, body: () => any)
    {
        super(name, body);
    }

    /**
     * 转换为完整的 GLSL 代码（fragment shader）
     * @returns 完整的 GLSL 代码，包括 precision、uniforms 和函数定义
     */
    toGLSL(): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toGLSL('fragment');

        // 从函数的 dependencies 中分析获取 uniforms 和 precision（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // Fragment shader 需要 precision 声明（从函数依赖中获取）
        if (dependencies.precision)
        {
            lines.push(dependencies.precision.toGLSL('fragment'));
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toGLSL('fragment'));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toGLSL('fragment');
        lines.push(...funcCode.split('\n'));

        return lines.join('\n') + '\n';
    }

    /**
     * 转换为完整的 WGSL 代码（fragment shader）
     * @returns 完整的 WGSL 代码，包括 uniforms 和函数定义
     */
    toWGSL(): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toWGSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toWGSL('fragment');

        // 从函数的 dependencies 中分析获取 uniforms（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toWGSL('fragment'));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toWGSL('fragment');
        lines.push(...funcCode.split('\n'));

        return lines.join('\n') + '\n';
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
    return new Fragment(name, body);
}

