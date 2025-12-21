import { IElement, ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { getCurrentIfStatement } from '../ifStack';
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
        const stmt = {
            toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
            toWGSL: () => `var ${name} = ${expr.toWGSL()};`,
        };

        // 检查是否在 if 语句体中
        const currentIfStatement = getCurrentIfStatement();
        if (currentIfStatement)
        {
            // 如果在 if 语句体中，将语句添加到当前 if 语句的 statements 中
            currentIfStatement.statements.push(stmt);
        }
        else
        {
            // 否则将语句添加到当前函数的 statements 中
            currentFunc.statements.push(stmt);
        }
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