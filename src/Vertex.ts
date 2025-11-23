import { Func } from './Func';

/**
 * Vertex 类，继承自 Func
 */
export class Vertex extends Func
{
    constructor(name: string, body: () => void)
    {
        super(name, body);
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

        // 从函数的 dependencies 中分析获取 attributes、uniforms 和 varyings（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

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

        // 生成 varyings（只包含实际使用的，在 vertex shader 中作为输出）
        for (const varying of dependencies.varyings)
        {
            lines.push(varying.toGLSL('vertex'));
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toGLSL('vertex');
        const funcLines = funcCode.split('\n').filter(line => line.trim() !== '');

        // 如果有声明和函数代码，在它们之间添加一个空行
        if (lines.length > 0 && funcLines.length > 0)
        {
            lines.push('');
        }

        lines.push(...funcLines);

        // 移除末尾的空行，但保留其他空行（用于分隔）
        const result: string[] = [];
        for (let i = 0; i < lines.length; i++)
        {
            const line = lines[i];
            const isLast = i === lines.length - 1;
            // 如果是最后一行且为空，跳过
            if (isLast && line.trim() === '')
            {
                continue;
            }
            result.push(line);
        }

        return result.join('\n');
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
        super.toWGSL('vertex');

        // 从函数的 dependencies 中分析获取 attributes、uniforms 和 structs（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // 生成结构体定义（只包含实际使用的）
        for (const struct of dependencies.structs)
        {
            lines.push(struct.toWGSL('vertex'));
        }

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

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toWGSL('vertex');
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

