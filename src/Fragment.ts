import { Func } from './Func';
import { Uniform } from './Uniform';

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

        // 从函数的 dependencies 中分析获取 uniforms、precision、varyings 和 samplers（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // Fragment shader 需要 precision 声明（从函数依赖中获取）
        if (dependencies.precision)
        {
            lines.push(dependencies.precision.toGLSL('fragment'));
        }

        // 生成 varyings（只包含实际使用的，在 fragment shader 中作为输入）
        for (const varying of dependencies.varyings)
        {
            lines.push(varying.toGLSL('fragment'));
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toGLSL('fragment'));
        }

        // 生成 samplers（只包含实际使用的）
        for (const sampler of dependencies.samplers)
        {
            lines.push(sampler.toGLSL('fragment'));
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toGLSL('fragment');
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
     * 转换为完整的 WGSL 代码（fragment shader）
     * @returns 完整的 WGSL 代码，包括 uniforms 和函数定义
     */
    toWGSL(): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toWGSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toWGSL('fragment');

        // 从函数的 dependencies 中分析获取 uniforms 和 structs（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // 自动分配 binding（对于 binding 缺省的 uniform）
        this.allocateBindings(dependencies.uniforms, dependencies.samplers);

        // 生成结构体定义（只包含实际使用的）
        for (const struct of dependencies.structs)
        {
            lines.push(struct.toWGSL('fragment'));
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toWGSL('fragment'));
        }

        // 生成 samplers（只包含实际使用的）
        // 在 WGSL 中，sampler.toWGSL() 返回多行（texture 和 sampler 声明）
        for (const sampler of dependencies.samplers)
        {
            const samplerWgsl = sampler.toWGSL('fragment');
            lines.push(...samplerWgsl.split('\n'));
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

    /**
     * 自动分配 binding 值
     * @param uniforms uniform 集合
     * @param samplers sampler 集合
     */
    private allocateBindings(uniforms: Set<Uniform>, samplers: Set<any>): void
    {
        // 按 group 分组，计算每个 group 下已使用的 binding
        const usedBindingsByGroup = new Map<number, Set<number>>();

        // 收集已显式指定的 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding !== undefined)
            {
                const group = uniform.group ?? 0;
                if (!usedBindingsByGroup.has(group))
                {
                    usedBindingsByGroup.set(group, new Set());
                }
                usedBindingsByGroup.get(group)!.add(uniform.binding);
            }
        }

        // 收集 sampler 占用的 binding（sampler 占用两个 binding：texture 和 sampler）
        for (const sampler of samplers)
        {
            const group = sampler.group ?? 0;
            const binding = sampler.binding ?? 0;
            if (!usedBindingsByGroup.has(group))
            {
                usedBindingsByGroup.set(group, new Set());
            }
            usedBindingsByGroup.get(group)!.add(binding);
            usedBindingsByGroup.get(group)!.add(binding + 1);
        }

        // 为 binding 缺省的 uniform 自动分配 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding === undefined)
            {
                const group = uniform.group ?? 0;
                const usedBindings = usedBindingsByGroup.get(group) ?? new Set();

                // 找到下一个未使用的 binding
                let nextBinding = 0;
                while (usedBindings.has(nextBinding))
                {
                    nextBinding++;
                }

                // 分配 binding
                uniform.setAutoBinding(nextBinding);
                usedBindings.add(nextBinding);
                usedBindingsByGroup.set(group, usedBindings);
            }
        }
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

