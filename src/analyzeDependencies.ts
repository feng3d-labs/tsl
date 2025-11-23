import { Attribute } from './Attribute';
import { Precision } from './Precision';
import { Struct } from './struct';
import { Uniform } from './Uniform';

/**
 * 分析函数依赖中使用的 attributes、uniforms、precision 和 structs
 * @param dependencies 函数依赖数组
 * @returns 使用的 Attribute、Uniform、Precision 和 Struct 实例集合
 */
export function analyzeDependencies(dependencies: any[]): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision; structs: Set<Struct<any>> }
{
    const attributes = new Set<Attribute>();
    const uniforms = new Set<Uniform>();
    const structs = new Set<Struct<any>>();
    let precision: Precision | undefined;
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

        // 如果是 Precision 实例，保存（只取第一个）
        if (value instanceof Precision)
        {
            if (!precision)
            {
                precision = value;
            }

            return;
        }

        // 如果是 Struct 实例，添加到 structs 集合
        if (value instanceof Struct)
        {
            structs.add(value);

            // 继续分析结构体的依赖
            if (typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies))
            {
                for (const dep of value.dependencies)
                {
                    analyzeValue(dep);
                }
            }

            return;
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

    return { attributes, uniforms, precision, structs };
}

