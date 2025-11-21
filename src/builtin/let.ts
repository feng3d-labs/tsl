import { Expression } from './Expression';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 let 语句）
 * @param name 变量名
 * @param expr 表达式
 * @returns 设置了变量名的 Expression 实例
 */
export function _let<T extends Expression>(name: string, expr: T): T
{
    // 创建一个新的 Expression，使用相同的 config，但设置 varName
    return new Expression(expr.config, name) as T;
}

