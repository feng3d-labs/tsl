import { ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { getCurrentIfStatement } from '../ifStack';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 let 语句）
 * @param name 变量名
 * @param expr 表达式
 * @returns 设置了变量名的表达式实例
 */
export function let_<T extends ShaderValue>(name: string, expr: T): T
{
    const cls = expr.constructor;
    const result: ShaderValue = new (cls as any)();

    result.toGLSL = () => `${name}`;
    result.toWGSL = () => `${name}`;
    result.dependencies = [expr];

    // 收集 let 语句
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        const stmt = {
            toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
            toWGSL: () => `let ${name} = ${expr.toWGSL()};`,
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

    return result as T;
}
