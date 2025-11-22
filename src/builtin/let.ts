import { IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 let 语句）
 * @param name 变量名
 * @param expr 表达式
 * @returns 设置了变量名的表达式实例
 */
export function let_<T extends IType>(name: string, expr: T): T
{
    const cls = expr.constructor;
    const result: IType = new (cls as any)();

    result.toGLSL = () => `${name}`;
    result.toWGSL = () => `${name}`;
    result.dependencies = [expr];

    // 收集 let 语句
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
            toWGSL: () => `let ${name} = ${expr.toWGSL()};`,
        });
        // 收集依赖
        currentFunc.dependencies.push(result);
    }

    return result as T;
}
