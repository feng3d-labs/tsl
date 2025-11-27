import { Func } from './Func';
import { Precision } from './Precision';
import { Sampler } from './Sampler';
import { Uniform } from './Uniform';
import { Vertex } from './Vertex';
import { Varying } from './Varying';
import { VaryingStruct } from './varyingStruct';

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

        // Fragment shader 需要 precision 声明（从函数依赖中获取，如果没有则默认使用 highp）
        if (dependencies.precision)
        {
            lines.push(dependencies.precision.toGLSL('fragment'));
        }
        else
        {
            // 如果没有指定 precision，默认使用 highp
            const defaultPrecision = new Precision('highp');
            lines.push(defaultPrecision.toGLSL('fragment'));
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

        // 生成外部定义的var_变量（作为全局const）
        const externalVars = dependencies.externalVars;
        for (const { name, expr } of externalVars)
        {
            lines.push(`const ${expr.glslType} ${name} = ${expr.toGLSL('fragment')};`);
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
     * @param vertexShader 可选的顶点着色器，用于避免 binding 冲突
     * @returns 完整的 WGSL 代码，包括 uniforms 和函数定义
     */
    toWGSL(): string;
    toWGSL(vertexShader?: Vertex): string
    toWGSL(vertexShader?: Vertex): string
    {
        const lines: string[] = [];

        // 先执行 body 收集依赖（通过调用父类的 toWGSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toWGSL('fragment');

        // 从函数的 dependencies 中分析获取 uniforms 和 structs（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // 自动分配 varying location（对于 location 缺省的 varying），确保与 vertex shader 一致
        // 按照结构体字段定义的顺序来处理 varyings
        this.allocateVaryingLocations(dependencies.varyings, dependencies.structs, vertexShader);

        // 自动分配 binding（对于 binding 缺省的 uniform），考虑顶点着色器的 binding
        this.allocateBindings(dependencies.uniforms, dependencies.samplers, vertexShader);

        // 生成结构体定义（只包含实际使用的）
        for (const struct of dependencies.structs)
        {
            lines.push(struct.toWGSLDefinition());
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

        // 生成外部定义的var_变量（作为全局const）
        const externalVars = dependencies.externalVars;
        for (const { name, expr } of externalVars)
        {
            lines.push(`const ${name}: ${expr.wgslType} = ${expr.toWGSL('fragment')};`);
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
     * 自动分配 varying location 值
     * @param varyings varying 集合
     * @param structs 结构体集合，用于按字段定义顺序处理 varyings
     * @param vertexShader 可选的顶点着色器，用于确保 varying location 一致
     */
    private allocateVaryingLocations(varyings: Set<Varying>, structs: Set<VaryingStruct<any>>, vertexShader?: Vertex): void
    {
        // 收集已使用的 location
        const usedLocations = new Map<string, number>(); // name -> location

        // 如果提供了顶点着色器，从顶点着色器中获取已分配的 varying location
        if (vertexShader)
        {
            // 确保顶点着色器的依赖已收集
            vertexShader.toWGSL();
            const vertexDependencies = vertexShader.getAnalyzedDependencies();

            // 从 vertex shader 中收集已分配的 varying location
            for (const varying of vertexDependencies.varyings)
            {
                const effectiveLocation = varying.getEffectiveLocation();
                usedLocations.set(varying.name, effectiveLocation);
            }
        }

        // 收集 fragment shader 中已显式指定的 location
        for (const varying of varyings)
        {
            if (varying.location !== undefined)
            {
                usedLocations.set(varying.name, varying.location);
            }
        }

        // 按照结构体字段定义的顺序来处理 varyings
        const varyingOrder: Varying[] = [];
        for (const struct of structs)
        {
            // 按照结构体字段定义的顺序遍历
            for (const [fieldName, value] of Object.entries(struct.fields))
            {
                if (value && typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies) && value.dependencies.length > 0)
                {
                    const dep = value.dependencies[0];
                    if (dep instanceof Varying && varyings.has(dep))
                    {
                        // 避免重复添加
                        if (!varyingOrder.includes(dep))
                        {
                            varyingOrder.push(dep);
                        }
                    }
                }
            }
        }

        // 对于不在结构体中的 varyings，添加到末尾
        for (const varying of varyings)
        {
            if (!varyingOrder.includes(varying))
            {
                varyingOrder.push(varying);
            }
        }

        // 为 location 缺省的 varying 自动分配 location（按照顺序）
        for (const varying of varyingOrder)
        {
            if (varying.location === undefined)
            {
                // 如果 vertex shader 中有同名 varying，使用相同的 location
                const existingLocation = usedLocations.get(varying.name!);
                if (existingLocation !== undefined)
                {
                    varying.setAutoLocation(existingLocation);
                }
                else
                {
                    // 找到下一个未使用的 location
                    const allUsedLocations = new Set(usedLocations.values());
                    let nextLocation = 0;
                    while (allUsedLocations.has(nextLocation))
                    {
                        nextLocation++;
                    }

                    // 分配 location
                    varying.setAutoLocation(nextLocation);
                    usedLocations.set(varying.name!, nextLocation);
                }
            }
        }
    }

    /**
     * 自动分配 binding 值
     * @param uniforms uniform 集合
     * @param samplers sampler 集合
     * @param vertexShader 可选的顶点着色器，用于避免 binding 冲突
     */
    private allocateBindings(uniforms: Set<Uniform>, samplers: Set<Sampler>, vertexShader?: Vertex): void
    {
        // 按 group 分组，计算每个 group 下已使用的 binding
        const usedBindingsByGroup = new Map<number, Set<number>>();

        // 获取或创建指定 group 的 usedBindings 集合
        const getUsedBindings = (group: number): Set<number> =>
        {
            if (!usedBindingsByGroup.has(group))
            {
                usedBindingsByGroup.set(group, new Set());
            }

            return usedBindingsByGroup.get(group)!;
        };

        // 如果提供了顶点着色器，先收集顶点着色器中已使用的 binding
        if (vertexShader)
        {
            // 确保顶点着色器的依赖已收集
            vertexShader.toWGSL();
            const vertexDependencies = vertexShader.getAnalyzedDependencies();

            // 收集顶点着色器中的 uniform binding
            for (const uniform of vertexDependencies.uniforms)
            {
                const effectiveBinding = uniform.getEffectiveBinding();
                if (effectiveBinding !== undefined)
                {
                    getUsedBindings(uniform.getEffectiveGroup()).add(effectiveBinding);
                }
            }

            // 收集顶点着色器中的 sampler binding（如果有）
            for (const sampler of vertexDependencies.samplers)
            {
                const effectiveBinding = sampler.getEffectiveBinding();
                const effectiveGroup = sampler.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);
                usedBindings.add(effectiveBinding);
                usedBindings.add(effectiveBinding + 1);
            }
        }

        // 收集已显式指定的 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding !== undefined)
            {
                getUsedBindings(uniform.getEffectiveGroup()).add(uniform.binding);
            }
        }

        // 收集已显式指定的 sampler binding（sampler 占用两个 binding：texture 和 sampler）
        for (const sampler of samplers)
        {
            if (sampler.binding !== undefined)
            {
                const effectiveGroup = sampler.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);
                usedBindings.add(sampler.binding);
                usedBindings.add(sampler.binding + 1);
            }
        }

        // 为 binding 缺省的 uniform 自动分配 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding === undefined)
            {
                const effectiveGroup = uniform.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);

                // 找到下一个未使用的 binding
                let nextBinding = 0;
                while (usedBindings.has(nextBinding))
                {
                    nextBinding++;
                }

                // 分配 binding
                uniform.setAutoBinding(nextBinding);
                usedBindings.add(nextBinding);
            }
        }

        // 为 binding 缺省的 sampler 自动分配 binding（sampler 占用两个 binding）
        for (const sampler of samplers)
        {
            if (sampler.binding === undefined)
            {
                const effectiveGroup = sampler.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);

                // 找到下一个未使用的 binding（需要连续两个 binding）
                let nextBinding = 0;
                while (usedBindings.has(nextBinding) || usedBindings.has(nextBinding + 1))
                {
                    nextBinding++;
                }

                // 分配 binding
                sampler.setAutoBinding(nextBinding);
                usedBindings.add(nextBinding);
                usedBindings.add(nextBinding + 1);
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

