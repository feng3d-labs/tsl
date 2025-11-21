import { Expression } from './Expression';
import { FunctionCallConfig, generateFunctionCallWGSL } from './vec4';

/**
 * 收集 Expression 中所有需要生成的 let 语句
 * @param expr Expression 实例
 * @param letStatements 用于收集 let 语句的数组
 * @returns 表达式的代码字符串
 */
export function collectLetStatements(expr: Expression, letStatements: string[]): string
{
    // 如果设置了 varName，需要生成 let 语句
    if (expr.varName)
    {
        const exprCode = generateExpressionCode(expr.config, letStatements);
        letStatements.push(`    let ${expr.varName} = ${exprCode};`);
        return expr.varName;
    }

    // 否则生成表达式代码
    return generateExpressionCode(expr.config, letStatements);
}

/**
 * 生成表达式代码，并收集所有嵌套的 let 语句
 */
function generateExpressionCode(config: FunctionCallConfig, letStatements: string[]): string
{
    // 处理操作符
    if (config.function === '*')
    {
        const left = config.args[0];
        const right = config.args[1];
        const leftStr = left instanceof Expression 
            ? collectLetStatements(left, letStatements) 
            : (typeof left === 'object' && left !== null && 'function' in left 
                ? generateExpressionCode(left as FunctionCallConfig, letStatements) 
                : String(left));
        const rightStr = right instanceof Expression 
            ? collectLetStatements(right, letStatements) 
            : (typeof right === 'object' && right !== null && 'function' in right 
                ? generateExpressionCode(right as FunctionCallConfig, letStatements) 
                : String(right));
        return `${leftStr} * ${rightStr}`;
    }

    // 处理函数调用
    const args = config.args.map(arg =>
    {
        if (typeof arg === 'string' || typeof arg === 'number')
        {
            return String(arg);
        }
        if (arg instanceof Expression)
        {
            return collectLetStatements(arg, letStatements);
        }
        if (typeof arg === 'object' && arg !== null && 'function' in arg)
        {
            return generateExpressionCode(arg as FunctionCallConfig, letStatements);
        }
        return String(arg);
    }).join(', ');

    return `${config.function}(${args})`;
}

