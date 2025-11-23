import { IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';

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
        currentFunc.statements.push({
            toGLSL: (type: 'vertex' | 'fragment') =>
            {
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

