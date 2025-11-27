import { Func } from './Func';
import { Uniform } from './Uniform';
import { Sampler } from './Sampler';
import { Attribute } from './Attribute';
import { Varying } from './Varying';
import { VaryingStruct } from './varyingStruct';

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
     * @param shaderType 着色器类型（忽略，vertex shader 固定为 'vertex'）
     * @param version GLSL 版本（1 = WebGL 1.0, 2 = WebGL 2.0，默认 1）
     * @returns 完整的 GLSL 代码，包括 attributes、uniforms 和函数定义
     */
    toGLSL(shaderType: 'vertex' | 'fragment' = 'vertex', version: 1 | 2 = 1): string
    {
        const lines: string[] = [];

        // 添加版本声明（WebGL 2.0）
        if (version === 2)
        {
            lines.push('#version 300 es');
            lines.push('');
            lines.push('precision highp float;');
            lines.push('precision highp int;');
            lines.push('');
        }

        // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
        // 这里只为了收集依赖，不生成完整代码
        super.toGLSL('vertex', version);

        // 从函数的 dependencies 中分析获取 attributes、uniforms、varyings 和 samplers（使用缓存）
        const dependencies = this.getAnalyzedDependencies();

        // 自动分配 location（对于 location 缺省的 attribute）
        this.allocateLocations(dependencies.attributes);

        // 生成 attributes（只包含实际使用的）
        for (const attr of dependencies.attributes)
        {
            lines.push(attr.toGLSL('vertex', version));
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toGLSL('vertex', version));
        }

        // 生成结构体的 varying 声明（GLSL 中不支持结构体作为 varying，需要展开为单独的 varying）
        for (const struct of dependencies.structs)
        {
            const structVaryingDecl = struct.toGLSLDefinition('vertex', version);
            if (structVaryingDecl)
            {
                lines.push(structVaryingDecl);
            }
        }

        // 生成其他 varyings（不在结构体中的，在 vertex shader 中作为输出）
        for (const varying of dependencies.varyings)
        {
            // 检查这个 varying 是否已经在结构体中声明了
            let inStruct = false;
            for (const struct of dependencies.structs)
            {
                for (const fieldValue of Object.values(struct.fields))
                {
                    if (fieldValue && typeof fieldValue === 'object' && 'dependencies' in fieldValue && Array.isArray(fieldValue.dependencies))
                    {
                        for (const dep of fieldValue.dependencies)
                        {
                            if (dep === varying)
                            {
                                inStruct = true;
                                break;
                            }
                        }
                        if (inStruct) break;
                    }
                }
                if (inStruct) break;
            }
            // 如果不在结构体中，才单独声明
            if (!inStruct)
            {
                lines.push(varying.toGLSL('vertex', version));
            }
        }

        // 生成外部定义的var_变量（作为全局const）
        const externalVars = dependencies.externalVars;
        for (const { name, expr } of externalVars)
        {
            lines.push(`const ${expr.glslType} ${name} = ${expr.toGLSL('vertex', version)};`);
        }

        // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
        const funcCode = super.toGLSL('vertex', version);
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

        // 自动分配 location（对于 location 缺省的 attribute）
        this.allocateLocations(dependencies.attributes);

        // 自动分配 binding（对于 binding 缺省的 uniform）
        this.allocateBindings(dependencies.uniforms, new Set());

        // 生成结构体定义（包含所有字段，location 分配在 toWGSLDefinition 中完成）
        for (const struct of dependencies.structs)
        {
            lines.push(struct.toWGSLDefinition());
        }

        // 生成 uniforms（只包含实际使用的）
        for (const uniform of dependencies.uniforms)
        {
            lines.push(uniform.toWGSL('vertex'));
        }

        // 生成外部定义的var_变量（作为全局const）
        const externalVars = dependencies.externalVars;
        for (const { name, expr } of externalVars)
        {
            lines.push(`const ${name}: ${expr.wgslType} = ${expr.toWGSL('vertex')};`);
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

    /**
     * 自动分配 location 值
     * @param attributes attribute 集合
     */
    private allocateLocations(attributes: Set<Attribute>): void
    {
        const usedLocations = new Set<number>();

        // 收集已显式指定的 location
        for (const attribute of attributes)
        {
            if (attribute.location !== undefined)
            {
                usedLocations.add(attribute.location);
            }
        }

        // 为 location 缺省的 attribute 自动分配 location
        for (const attribute of attributes)
        {
            if (attribute.location === undefined)
            {
                // 找到下一个未使用的 location
                let nextLocation = 0;
                while (usedLocations.has(nextLocation))
                {
                    nextLocation++;
                }

                // 分配 location
                attribute.setAutoLocation(nextLocation);
                usedLocations.add(nextLocation);
            }
        }
    }

    /**
     * 自动分配 binding 值
     * @param uniforms uniform 集合
     * @param samplers sampler 集合
     */
    private allocateBindings(uniforms: Set<Uniform>, samplers: Set<Sampler>): void
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
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Vertex 实例
 */
export function vertex(name: string, body: () => void): Vertex
{
    return new Vertex(name, body);
}

