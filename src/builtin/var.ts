import { IElement, ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Float } from './types/float';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 var 语句）
 * @param name 变量名
 * @param expr 表达式或字面值
 * @returns 设置了变量名的表达式实例
 */
export function var_<T extends ShaderValue>(name: string, expr: T): T;
export function var_(name: string, expr: number): Float;
export function var_(...args: any[]): any
{
    const name = args[0] as string;
    let expr: ShaderValue;

    // 如果第二个参数是数字，自动转换为 Float
    if (typeof args[1] === 'number')
    {
        expr = new Float(args[1]);
    }
    else
    {
        expr = args[1] as ShaderValue;
    }

    const cls = expr.constructor;
    const result: ShaderValue = new (cls as any)();

    result.toGLSL = () => `${name}`;
    result.toWGSL = () => `${name}`;
    result.dependencies = [expr];

    // 收集 var 语句
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
            toWGSL: () => `var ${name} = ${expr.toWGSL()};`,
        });
        // 收集依赖
        currentFunc.dependencies.push(result);
    }
    else
    {
        // 在函数外部定义，标记为外部变量并保存初始化信息
        (result as any)._isExternalVar = true;
        (result as any)._varName = name;
        (result as any)._varExpr = expr;
    }

    return result;
}