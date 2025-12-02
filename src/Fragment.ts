import { buildShader } from './buildShader';
import { Func } from './Func';
import { Precision } from './precision';
import { Sampler } from './sampler';
import { Uniform } from './uniform';
import { Vertex } from './Vertex';
import { FragmentOutput } from './fragmentOutput';
import { VaryingStruct } from './varyingStruct';
import { ShaderValue } from './IElement';

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
    toGLSL(version: 1 | 2 = 1): string
    {
        return buildShader({ language: 'glsl', stage: 'fragment', version: version }, () =>
        {
            const lines: string[] = [];

            // 添加版本声明（WebGL 2.0）
            if (version === 2)
            {
                lines.push('#version 300 es');
                lines.push('');
            }

            // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
            // 这里只为了收集依赖，不生成完整代码
            super.toGLSL();

            // 从函数的 dependencies 中分析获取 uniforms、precision、varyings 和 samplers（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // Fragment shader 需要 precision 声明
            // 收集已设置的 precision
            const precisionMap = new Map<string, Precision>();
            for (const prec of dependencies.precisions)
            {
                precisionMap.set(prec.type, prec);
            }

            // 生成 float precision（如果没有设置，默认使用 highp）
            const floatPrecision = precisionMap.get('float') || new Precision('highp', 'float');
            lines.push(floatPrecision.toGLSL());

            // WebGL 2.0 需要 int precision（只有在使用了 int 类型时才生成，如果没有设置，默认使用 highp）
            if (version === 2)
            {
                // 检查是否有 int 类型的使用
                // 1. 检查 uniforms 中是否有 int 类型的 uniform
                // 2. 检查 attributes 中是否有 int 类型的 attribute
                // 3. 检查所有依赖中是否有 glslType === 'int' 的 ShaderValue
                let hasIntType = false;

                // 检查 uniforms
                hasIntType = Array.from(dependencies.uniforms).some(u =>
                    u.value && u.value.glslType === 'int',
                );

                // 检查 attributes
                if (!hasIntType)
                {
                    hasIntType = Array.from(dependencies.attributes).some(a =>
                        a.value && a.value.glslType === 'int',
                    );
                }

                // 检查所有依赖中的 ShaderValue（包括字面量）
                if (!hasIntType)
                {
                    const checkForInt = (value: any): boolean =>
                    {
                        if (!value || typeof value !== 'object')
                        {
                            return false;
                        }

                        // 检查是否是 ShaderValue 且有 int 类型
                        if ('glslType' in value && value.glslType === 'int')
                        {
                            return true;
                        }

                        // 递归检查 dependencies
                        if ('dependencies' in value && Array.isArray(value.dependencies))
                        {
                            return value.dependencies.some((dep: any) => checkForInt(dep));
                        }

                        return false;
                    };

                    hasIntType = this.dependencies.some(dep => checkForInt(dep));
                }

                if (hasIntType)
                {
                    const intPrecision = precisionMap.get('int') || new Precision('highp', 'int');
                    lines.push(intPrecision.toGLSL());
                }
            }

            // 检查是否有 sampler2DArray，如果有则需要添加 precision 声明（如果没有设置，默认使用 lowp）
            const hasSampler2DArray = Array.from(dependencies.samplers).some(s =>
                s.getSamplerType() === '2DArray',
            );
            if (hasSampler2DArray)
            {
                const samplerPrecision = precisionMap.get('sampler2DArray') || new Precision('lowp', 'sampler2DArray');
                lines.push(samplerPrecision.toGLSL());
            }

            // 生成结构体的 varying 声明（GLSL 中不支持结构体作为 varying，需要展开为单独的 varying）
            for (const struct of dependencies.structs)
            {
                const structVaryingDecl = struct.toGLSLDefinition('fragment');
                if (structVaryingDecl)
                {
                    lines.push(structVaryingDecl);
                }
            }

            // 生成其他 varyings（不在结构体中的）
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
                    lines.push(varying.toGLSL());
                }
            }

            // 生成 uniforms（只包含实际使用的）
            for (const uniform of dependencies.uniforms)
            {
                lines.push(uniform.toGLSL());
            }

            // 生成 samplers（只包含实际使用的）
            for (const sampler of dependencies.samplers)
            {
                lines.push(sampler.toGLSL());
            }

            // WebGL 2.0 需要声明输出变量
            if (version === 2)
            {
                lines.push('');
                // 如果有 FragmentOutput，使用多个输出；否则使用默认的单个输出
                if (dependencies.fragmentOutput)
                {
                    const outputDecls = dependencies.fragmentOutput.toGLSLDefinitions();
                    for (const decl of outputDecls)
                    {
                        lines.push(decl);
                    }
                }
                else
                {
                    lines.push('layout(location = 0) out vec4 color;');
                }
            }

            // 生成外部定义的var_变量（作为全局const）
            const externalVars = dependencies.externalVars;
            for (const { name, expr } of externalVars)
            {
                lines.push(`const ${expr.glslType} ${name} = ${expr.toGLSL()};`);
            }

            // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
            const funcCode = super.toGLSL();
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

            const resultStr = result.join('\n');

            return resultStr;
        });

    }

    /**
     * 转换为完整的 WGSL 代码（fragment shader）
     * @param vertexShader 可选的顶点着色器，用于避免 binding 冲突
     * @returns 完整的 WGSL 代码，包括 uniforms 和函数定义
     */
    toWGSL(vertexShader?: Vertex): string
    {
        return buildShader({ language: 'wgsl', stage: 'fragment', version: 1 }, () =>
        {

            const lines: string[] = [];

            // 先执行 body 收集依赖（通过调用父类的 toWGSL 来触发，它会执行 body 并填充 dependencies）
            // 这里只为了收集依赖，不生成完整代码
            super.toWGSL();

            // 从函数的 dependencies 中分析获取 uniforms 和 structs（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // 自动分配 binding（对于 binding 缺省的 uniform），考虑顶点着色器的 binding
            this.allocateBindings(dependencies.uniforms, dependencies.samplers, vertexShader);

            // 生成结构体定义（包含所有字段，即使未使用）
            for (const struct of dependencies.structs)
            {
                lines.push(struct.toWGSLDefinition());
            }

            // 生成 FragmentOutput 结构体定义（如果有）
            if (dependencies.fragmentOutput)
            {
                lines.push(dependencies.fragmentOutput.toWGSLDefinition());
            }

            // 生成 uniforms（只包含实际使用的）
            for (const uniform of dependencies.uniforms)
            {
                lines.push(uniform.toWGSL());
            }

            // 生成 samplers（只包含实际使用的）
            // 在 WGSL 中，sampler.toWGSL() 返回多行（texture 和 sampler 声明）
            for (const sampler of dependencies.samplers)
            {
                const samplerWgsl = sampler.toWGSL();
                lines.push(...samplerWgsl.split('\n'));
            }

            // 生成外部定义的var_变量（作为全局const）
            const externalVars = dependencies.externalVars;
            for (const { name, expr } of externalVars)
            {
                lines.push(`const ${name}: ${expr.wgslType} = ${expr.toWGSL()};`);
            }

            // 空行
            if (lines.length > 0)
            {
                lines.push('');
            }

            // 添加 @fragment 标记
            lines.push('@fragment');

            // 生成函数签名和函数体
            // 查找输入结构体（VaryingStruct）
            let inputStruct: { varName: string; struct: VaryingStruct<any> } | undefined;
            for (const struct of dependencies.structs)
            {
                if (struct.hasVarying())
                {
                    inputStruct = { varName: 'v', struct };
                    // 函数中最多只会出现一个 VaryingStruct
                    break;
                }
            }

            // 生成函数参数
            let paramStr = '()';
            if (inputStruct)
            {
                paramStr = `(v: VaryingStruct)`;
            }

            // 生成返回类型：如果有 FragmentOutput，使用多个输出；否则使用单个输出
            let returnType: string;
            if (dependencies.fragmentOutput)
            {
                returnType = dependencies.fragmentOutput.toWGSLReturnType();
            }
            else
            {
                returnType = '@location(0) vec4<f32>';
            }

            lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);

            // 如果有 FragmentOutput，需要生成结构体变量并修改字段的 toWGSL 方法
            if (dependencies.fragmentOutput)
            {
                const fragmentOutput = dependencies.fragmentOutput;
                const structName = fragmentOutput.getStructName();
                const outputVarName = 'output';

                // 重写字段的 toWGSL 方法，使其返回 output.fieldName
                for (const [fieldName, value] of Object.entries(fragmentOutput.fields))
                {
                    const shaderValue = value as ShaderValue;
                    shaderValue.toWGSL = () => `${outputVarName}.${fieldName}`;
                }

                // 在函数体开头添加 var output: FragmentOut; 声明
                lines.push(`    var ${outputVarName}: ${structName};`);

                // 生成函数体
                this.statements.forEach(stmt =>
                {
                    lines.push(`    ${stmt.toWGSL()}`);
                });

                // 在函数体末尾添加 return output; 语句
                lines.push(`    return ${outputVarName};`);
            }
            else
            {
                // 生成函数体（单个输出，不需要结构体）
                this.statements.forEach(stmt =>
                {
                    lines.push(`    ${stmt.toWGSL()}`);
                });
            }

            lines.push('}');

            const resultStr = lines.join('\n') + '\n';

            return resultStr;
        });
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
        // 同时建立 uniform 名称到 binding 的映射，以便 fragment shader 中同名的 uniform 使用相同的 binding
        const vertexUniformBindingMap = new Map<string, { binding: number; group: number }>();
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
                    const effectiveGroup = uniform.getEffectiveGroup();
                    getUsedBindings(effectiveGroup).add(effectiveBinding);
                    // 建立名称到 binding 的映射
                    vertexUniformBindingMap.set(uniform.name, { binding: effectiveBinding, group: effectiveGroup });
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

                // 检查顶点着色器中是否有同名的 uniform，如果有，使用相同的 binding
                const vertexBinding = vertexUniformBindingMap.get(uniform.name);
                if (vertexBinding && vertexBinding.group === effectiveGroup)
                {
                    // 使用顶点着色器中的 binding
                    uniform.setAutoBinding(vertexBinding.binding);
                    usedBindings.add(vertexBinding.binding);
                }
                else
                {
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

