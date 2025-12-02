import { Attribute } from './Attribute';
import { Precision } from './Precision';
import { Sampler } from './Sampler';
import { VaryingStruct } from './varyingStruct';
import { Uniform } from './Uniform';
import { Varying } from './Varying';
import { ShaderValue } from './IElement';
import { FragmentOutput } from './fragmentOutput';

/**
 * 分析函数依赖中使用的 attributes、uniforms、precision、structs、varyings 和外部变量
 * @param dependencies 函数依赖数组
 * @returns 使用的 Attribute、Uniform、Precision、VaryingStruct、Varying、Sampler、FragmentOutput 和外部变量集合
 */
export function analyzeDependencies(dependencies: any[]): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precisions: Set<Precision>; structs: Set<VaryingStruct<any>>; varyings: Set<Varying>; samplers: Set<Sampler>; fragmentOutput?: FragmentOutput<any>; externalVars: Array<{ name: string; expr: ShaderValue }> }
{
    const attributes = new Set<Attribute>();
    const uniforms = new Set<Uniform>();
    const structs = new Set<VaryingStruct<any>>();
    const varyings = new Set<Varying>();
    const samplers = new Set<Sampler>();
    const externalVars = new Map<string, { name: string; expr: ShaderValue }>();
    const precisions = new Set<Precision>();
    let fragmentOutput: FragmentOutput<any> | undefined;
    const visited = new WeakSet();

    const analyzeValue = (value: any): void =>
    {
        if (value === null || value === undefined)
        {
            return;
        }

        // 避免重复访问同一个对象
        if (typeof value === 'object' && visited.has(value))
        {
            return;
        }
        if (typeof value === 'object')
        {
            visited.add(value);
        }

        // 如果是 Uniform 或 Attribute 实例，直接添加
        if (value instanceof Uniform)
        {
            uniforms.add(value);

            return;
        }

        if (value instanceof Attribute)
        {
            attributes.add(value);

            return;
        }

        // 如果是 Precision 实例，添加到集合中
        if (value instanceof Precision)
        {
            precisions.add(value);

            return;
        }

        // 如果是 Varying 实例，添加到 varyings 集合
        if (value instanceof Varying)
        {
            varyings.add(value);

            return;
        }

        // 如果是 Sampler 实例，添加到 samplers 集合
        if (value instanceof Sampler)
        {
            samplers.add(value);

            return;
        }

        // 如果是 FragmentOutput 实例，保存（只取第一个）
        if (value instanceof FragmentOutput)
        {
            if (!fragmentOutput)
            {
                fragmentOutput = value;
            }

            return;
        }

        // 如果是 VaryingStruct 实例，添加到 structs 集合
        if (value instanceof VaryingStruct)
        {
            structs.add(value);

            // 继续分析结构体的依赖，提取其中的 Varying
            if (typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies))
            {
                for (const dep of value.dependencies)
                {
                    analyzeValue(dep);
                }
            }

            // 分析结构体字段中的 Varying
            if (typeof value === 'object' && 'fields' in value)
            {
                for (const fieldValue of Object.values((value as any).fields))
                {
                    if (fieldValue && typeof fieldValue === 'object' && 'dependencies' in fieldValue && Array.isArray(fieldValue.dependencies))
                    {
                        for (const dep of fieldValue.dependencies)
                        {
                            if (dep instanceof Varying)
                            {
                                varyings.add(dep);
                            }
                        }
                    }
                }
            }

            return;
        }

        // 如果是外部定义的var_变量，收集它
        if (typeof value === 'object' && (value as any)._isExternalVar)
        {
            const varName = (value as any)._varName;
            const varExpr = (value as any)._varExpr;
            if (varName && varExpr && !externalVars.has(varName))
            {
                externalVars.set(varName, { name: varName, expr: varExpr });
            }
        }

        // 检查是否是 VaryingStruct 的字段值（通过 _varyingStruct 属性）
        if (typeof value === 'object' && (value as any)._varyingStruct instanceof VaryingStruct)
        {
            const struct = (value as any)._varyingStruct;
            structs.add(struct);
        }

        // 检查是否是 FragmentOutput 的字段值（通过 _fragmentOutput 属性）
        if (typeof value === 'object' && (value as any)._fragmentOutput instanceof FragmentOutput)
        {
            const output = (value as any)._fragmentOutput;
            if (!fragmentOutput)
            {
                fragmentOutput = output;
            }
        }

        // 如果是 IElement 实例（Vec2, Vec4 等），分析其 dependencies
        if (typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies))
        {
            for (const dep of value.dependencies)
            {
                analyzeValue(dep);
            }
        }
    };

    // 分析所有依赖
    for (const dep of dependencies)
    {
        analyzeValue(dep);
    }

    return { attributes, uniforms, precisions, structs, varyings, samplers, fragmentOutput, externalVars: Array.from(externalVars.values()) };
}

