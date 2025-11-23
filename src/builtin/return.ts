import { IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Struct } from '../struct';

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function return_<T extends IType>(expr: T): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        // 检查是否是结构体变量（通过检查 dependencies 中是否包含 Struct 实例）
        const isStructVar = expr.dependencies && expr.dependencies.some(dep => dep instanceof Struct);

        currentFunc.statements.push({
            toGLSL: (type: 'vertex' | 'fragment') =>
            {
                // 如果是结构体变量，在 GLSL 中不生成代码（输出已通过 assign 设置）
                if (isStructVar)
                {
                    return '';
                }

                if (type === 'vertex')
                {
                    return `gl_Position = ${expr.toGLSL(type)}; return;`;
                }
                else if (type === 'fragment')
                {
                    return `gl_FragColor = ${expr.toGLSL(type)}; return;`;
                }

                return `return ${expr.toGLSL(type)};`;
            },
            toWGSL: (type: 'vertex' | 'fragment') => `return ${expr.toWGSL(type)};`,
        });
        currentFunc.dependencies.push(expr);
    }
}

