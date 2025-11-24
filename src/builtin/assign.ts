import { ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Builtin } from './builtin';

/**
 * 赋值操作（用于对内置变量进行赋值）
 * @param target 目标变量（Builtin 实例）
 * @param value 要赋值的表达式
 */
export function assign(target: ShaderValue, value: ShaderValue): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        const stmt: any = {
            toGLSL: (type: 'vertex' | 'fragment') =>
            {
                return `${target.toGLSL(type)} = ${value.toGLSL(type)};`;
            },
            toWGSL: (type: 'vertex' | 'fragment') =>
            {
                // 在 WGSL 中，如果是 vertex shader 的 position，需要特殊处理
                const isPositionBuiltin = target instanceof Builtin && target.isPosition;
                if (isPositionBuiltin && type === 'vertex')
                {
                    // 在 vertex shader 中，position 是返回值，使用 return
                    return `return ${value.toWGSL(type)};`;
                }
                else
                {
                    return `${target.toWGSL(type)} = ${value.toWGSL(type)};`;
                }
            },
        };
        
        // 保存原始信息，用于自动创建结构体
        stmt._assignTarget = target;
        stmt._assignValue = value;
        
        currentFunc.statements.push(stmt);
        // 收集依赖（包括 target 和 value）
        currentFunc.dependencies.push(target);
        currentFunc.dependencies.push(value);
    }
}

