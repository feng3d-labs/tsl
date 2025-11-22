import { IElement } from '../IElement';
import { getCurrentFunc } from '../currentFunc';

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function _return<T extends IElement>(expr: T): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            toGLSL: (type?: 'vertex' | 'fragment') =>
            {
                if (type === 'vertex')
                {
                    return `gl_Position = ${expr.toGLSL()};`;
                }
                else if (type === 'fragment')
                {
                    return `gl_FragColor = ${expr.toGLSL()};`;
                }

                return `return ${expr.toGLSL()};`;
            },
            toWGSL: () => `return ${expr.toWGSL()};`,
        });
        currentFunc.dependencies.push(expr);
    }
}

