import { ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { getCurrentIfStatement } from '../ifStack';
import { Float } from './types/float';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 var 语句）
 * @param name 变量名
 * @param expr 表达式或字面值，或类型构造函数（用于声明未初始化的变量）
 * @returns 设置了变量名的表达式实例
 */
export function var_<T extends ShaderValue>(name: string, expr: T): T;
export function var_<T extends ShaderValue>(name: string, type: (...args: any[]) => T): T;
export function var_(name: string, expr: number): Float;
export function var_(...args: any[]): any
{
    const name = args[0] as string;
    const arg1 = args[1];

    let result: ShaderValue;
    let isTypeOnly = false; // 是否只声明类型（无初始值）

    // 如果第二个参数是数字，自动转换为 Float
    if (typeof arg1 === 'number')
    {
        const expr = new Float(arg1);
        result = new Float();
        result.toGLSL = () => `${name}`;
        result.toWGSL = () => `${name}`;
        result.dependencies = [expr];

        addStatement(name, result, expr, false);
    }
    // 如果第二个参数是函数（类型构造函数），创建未初始化的变量
    else if (typeof arg1 === 'function')
    {
        result = arg1();
        isTypeOnly = true;

        result.toGLSL = () => `${name}`;
        result.toWGSL = () => `${name}`;
        result.dependencies = [];

        addStatement(name, result, result, true);
    }
    // 否则是表达式
    else
    {
        const expr = arg1 as ShaderValue;
        const cls = expr.constructor;
        result = new (cls as any)();

        result.toGLSL = () => `${name}`;
        result.toWGSL = () => `${name}`;
        result.dependencies = [expr];

        addStatement(name, result, expr, false);
    }

    return result;
}

function addStatement(name: string, result: ShaderValue, expr: ShaderValue, isTypeOnly: boolean): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        const stmt = isTypeOnly
            ? {
                toGLSL: () => `${expr.glslType} ${name};`,
                toWGSL: () => `var ${name}: ${expr.wgslType};`,
            }
            : {
                toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
                toWGSL: () => `var ${name} = ${expr.toWGSL()};`,
            };

        // 检查是否在 if 语句体中
        const currentIfStatement = getCurrentIfStatement();
        if (currentIfStatement)
        {
            // 如果在 if 语句体中，使用 addStatement 自动判断添加到 if 体还是 else 体
            currentIfStatement.addStatement(stmt);
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
        (result as any)._isTypeOnly = isTypeOnly;
    }
}