import { IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Builtin } from './builtin';

/**
 * 赋值操作（用于对内置变量进行赋值）
 * @param target 目标变量（Builtin 实例）
 * @param value 要赋值的表达式
 */
export function assign(target: IType, value: IType): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            toGLSL: (type?: 'vertex' | 'fragment') =>
            {
                return `${target.toGLSL(type)} = ${value.toGLSL()};`;
            },
            toWGSL: (type?: 'vertex' | 'fragment') =>
            {
                // 在 WGSL 中，如果是 vertex shader 的 position，需要特殊处理
                const isPositionBuiltin = target instanceof Builtin && target.name === 'position';
                if (isPositionBuiltin && type === 'vertex')
                {
                    // 在 vertex shader 中，position 是返回值，使用 return
                    return `return ${value.toWGSL()};`;
                }
                else
                {
                    return `${target.toWGSL(type)} = ${value.toWGSL()};`;
                }
            },
        });
        // 收集依赖
        currentFunc.dependencies.push(value);
    }
}

