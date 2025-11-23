import { analyzeDependencies } from './analyzeDependencies';
import { Func } from './Func';

/**
 * Vertex 类，继承自 Func
 */
export class Vertex extends Func
{
    readonly shaderType = 'vertex' as const;

    constructor(name: string, body: () => void)
    {
        super(name, body, 'vertex');
    }

    /**
     * 转换为完整的 GLSL 代码（vertex shader）
     * @returns 完整的 GLSL 代码，包括 attributes、uniforms 和函数定义
     */
    toGLSL(): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toGLSL('vertex');

        // 从函数的 dependencies 中分析获取 attributes 和 uniforms
        const dependencies = analyzeDependencies(this.dependencies);

        // 生成 attributes（只包含实际使用的）
        for (const attr of dependencies.attributes)
        {
            lines.push(attr.toGLSL('vertex'));
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toGLSL('vertex'));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toGLSL('vertex');
        lines.push(...funcCode.split('\n'));

        return lines.join('\n') + '\n';
    }

    /**
     * 转换为完整的 WGSL 代码（vertex shader）
     * @returns 完整的 WGSL 代码，包括 uniforms、attributes 和函数定义
     */
    toWGSL(): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toWGSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toWGSL([]);

        // 从函数的 dependencies 中分析获取 attributes 和 uniforms
        const dependencies = analyzeDependencies(this.dependencies);

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toWGSL('vertex'));
        }

        // 空行
        if (lines.length > 0)
        {
            lines.push('');
        }

        // 准备 attributes 配置（只包含实际使用的）
        const attributes = Array.from(dependencies.attributes);

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toWGSL(attributes);
        lines.push(...funcCode.split('\n'));

        return lines.join('\n') + '\n';
    }
}

/**
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Vertex 实例
 */
export function vertex(name: string, body: () => void): Vertex
{
    return new Vertex(name, body);
}

