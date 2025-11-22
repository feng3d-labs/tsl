import { IElement } from '../IElement';
import { getCurrentFunc } from '../currentFunc';

/**
 * 语句类型
 */
export type StatementType = 'let' | 'return';

/**
 * 语句接口
 */
export interface Statement
{
    type: StatementType;
    name?: string; // let 语句的变量名
    expr: IElement; // 表达式
}

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function _return<T extends IElement>(expr: T): T
{
    const currentFunc = getCurrentFunc();
    if (currentFunc && 'addStatement' in currentFunc && typeof currentFunc.addStatement === 'function')
    {
        currentFunc.addStatement({
            type: 'return',
            expr,
        });
    }

    return expr;
}

