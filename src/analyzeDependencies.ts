import { Attribute } from './Attribute';
import { Precision } from './Precision';
import { Uniform } from './Uniform';

/**
 * 分析函数依赖中使用的 attributes、uniforms 和 precision
 * @param dependencies 函数依赖数组
 * @returns 使用的 Attribute、Uniform 和 Precision 实例集合
 */
export function analyzeDependencies(dependencies: any[]): { attributes: Set<Attribute>; uniforms: Set<Uniform>; precision?: Precision }
{
    const attributes = new Set<Attribute>();
    const uniforms = new Set<Uniform>();
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

    return { attributes, uniforms, precision };
}

