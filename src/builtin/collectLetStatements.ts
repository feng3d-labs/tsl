import { Expression } from './Expression';
import { FunctionCallConfig } from './utils';
import { formatNumber } from './formatNumber';

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
        if (typeof arg === 'string')
        {
            return arg;
        }

        if (typeof arg === 'number')
        {
            // 使用 formatNumber 格式化数字
            return formatNumber(arg);
        }

        if (arg instanceof Expression)
        {
            // 如果 Expression 是简单的 uniform/attribute 引用，直接返回其名称
            // 例如 { function: 'vec2', args: ['position'] } 应该返回 'position' 而不是 'vec2<f32>(position)'
            if (arg.config.args.length === 1 && typeof arg.config.args[0] === 'string')
            {
                return arg.config.args[0];
            }

            return collectLetStatements(arg, letStatements);
        }

        if (typeof arg === 'object' && arg !== null && 'function' in arg)
        {
            const funcConfig = arg as FunctionCallConfig;
            // 如果 FunctionCallConfig 是简单的 uniform/attribute 引用，直接返回其名称
            // 例如 { function: 'vec2', args: ['position'] } 应该返回 'position' 而不是 'vec2<f32>(position)'
            if (funcConfig.args.length === 1 && typeof funcConfig.args[0] === 'string')
            {
                return funcConfig.args[0];
            }

            return generateExpressionCode(funcConfig, letStatements);
        }

        return String(arg);
    }).join(', ');

    // 生成 WGSL 类型参数（如 vec4<f32>）
    const functionName = config.function;
    const vecMatch = functionName.match(/^(i|u)?vec(\d)$/);
    if (vecMatch)
    {
        const prefix = vecMatch[1] || '';
        const dimension = vecMatch[2];
        let typeParam: string;

        if (prefix === 'i')
        {
            typeParam = 'i32';
        }
        else if (prefix === 'u')
        {
            typeParam = 'u32';
        }
        else
        {
            typeParam = 'f32';
        }

        return `vec${dimension}<${typeParam}>(${args})`;
    }

    return `${config.function}(${args})`;
}

