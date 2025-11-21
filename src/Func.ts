import type { FuncDef } from './Vertex';
import { FUNC_SYMBOL } from './Vertex';

/**
 * 定义函数（通用函数，不指定着色器类型）
 * @param name 函数名
 * @param body 函数体
 * @returns 函数定义对象
 */
export function func(name: string, body: () => any): FuncDef
{
    return {
        __type__: FUNC_SYMBOL,
        name,
        body,
    };
}

/**
 * 检查对象是否为函数定义
 */
export function isFuncDef(obj: any): obj is FuncDef
{
    return obj && typeof obj === 'object' && obj.__type__ === FUNC_SYMBOL;
}

