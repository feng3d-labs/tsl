import { IElement } from '../IElement';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 let 语句）
 * @param name 变量名
 * @param expr 表达式
 * @returns 设置了变量名的表达式实例
 */
export function _let<T>(name: string, expr: T): T
{
    const cls = expr.constructor;
    const instance: IElement = new (cls as any)();

    instance.toGLSL = () => `${name}`;
    instance.toWGSL = () => `${name}`;
    instance.dependencies = [expr as IElement];

    return instance as T;
}
