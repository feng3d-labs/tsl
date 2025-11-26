import { ShaderValue } from '../IElement';

/**
 * 检测表达式字符串是否包含运算符
 */
function hasOperator(expr: string): boolean
{
    // 检查是否包含运算符（排除函数调用中的括号）
    // 简单检查：如果包含 +、-、*、/ 运算符
    return /[+\-*/]/.test(expr);
}

/**
 * 检测表达式是否包含加减运算符
 */
function hasAddSubOperator(expr: string): boolean
{
    return /[+-]/.test(expr);
}

/**
 * 检测表达式是否包含乘除运算符
 */
function hasMulDivOperator(expr: string): boolean
{
    // eslint-disable-next-line no-useless-escape
    return /[*\/]/.test(expr);
}

/**
 * 检测表达式的顶层运算符类型
 * 返回 'addsub' | 'muldiv' | null
 */
function getTopLevelOperator(expr: string): 'addsub' | 'muldiv' | null
{
    if (!hasOperator(expr))
    {
        return null;
    }

    // 简单检测：如果同时包含加减和乘除，根据优先级，顶层应该是加减
    // 如果只有乘除，顶层是乘除
    // 如果只有加减，顶层是加减
    const hasAddSub = hasAddSubOperator(expr);
    const hasMulDiv = hasMulDivOperator(expr);

    if (hasAddSub && hasMulDiv)
    {
        // 同时包含加减和乘除，需要更精确的检测
        // 由于乘除优先级更高，如果表达式包含乘除，顶层可能是加减（如果加减在外层）
        // 这里使用简单规则：如果同时存在，假设顶层是加减（因为乘除会被括号包裹）
        return 'addsub';
    }
    else if (hasAddSub)
    {
        return 'addsub';
    }
    else if (hasMulDiv)
    {
        return 'muldiv';
    }

    return null;
}

/**
 * 为表达式添加括号（如果需要）
 */
function wrapWithParens(expr: string, needsParens: boolean): string
{
    return needsParens ? `(${expr})` : expr;
}

/**
 * 格式化操作数，根据运算符优先级决定是否需要括号
 * @param operand 操作数
 * @param currentOp 当前运算符 ('+', '-', '*', '/')
 * @param isLeftOperand 是否是左操作数
 * @param shaderType 着色器类型
 * @param toCode 转换为代码的函数
 */
export function formatOperand(
    operand: ShaderValue | number,
    currentOp: '+' | '-' | '*' | '/',
    isLeftOperand: boolean,
    shaderType: 'vertex' | 'fragment',
    toCode: (type: 'vertex' | 'fragment') => string,
): string
{
    if (typeof operand === 'number')
    {
        return operand.toString();
    }

    const operandStr = toCode(shaderType);
    const hasOp = hasOperator(operandStr);
    if (!hasOp)
    {
        // 没有运算符，不需要括号
        return operandStr;
    }

    const operandTopOp = getTopLevelOperator(operandStr);
    const hasAddSub = hasAddSubOperator(operandStr);
    const hasMulDiv = hasMulDivOperator(operandStr);

    let needsParens = false;

    if (currentOp === '+')
    {
        // 加法：左结合，同级不需要括号
        // 如果操作数是乘除表达式，不需要括号（乘除优先级更高，会自动先计算）
        // 如果操作数是加减表达式，不需要括号（同级，左结合）
    }
    else if (currentOp === '-')
    {
        // 减法：左结合
        // 左操作数：如果是加减表达式，不需要括号（同级，左结合）
        // 右操作数：如果是加减表达式，需要括号（因为 a - (b + c) ≠ a - b + c）
        //           如果是乘除表达式，不需要括号（乘除优先级更高）
        if (isLeftOperand)
        {
            // 左操作数：如果操作数是乘除表达式，不需要括号（乘除优先级更高）
            // 如果操作数是加减表达式，不需要括号（同级，左结合）
        }
        else
        {
            // 右操作数：如果操作数是加减表达式，需要括号
            if (operandTopOp === 'addsub')
            {
                needsParens = true;
            }
            // 如果操作数是乘除表达式，不需要括号（乘除优先级更高）
        }
    }
    else if (currentOp === '*')
    {
        // 乘法：左结合，同级不需要括号
        // 如果操作数是加减表达式，需要括号（优先级更低）
        if (operandTopOp === 'addsub')
        {
            needsParens = true;
        }
        // 如果操作数是乘除表达式，不需要括号（同级，左结合）
    }
    else if (currentOp === '/')
    {
        // 除法：左结合
        // 左操作数：如果是乘除表达式，不需要括号（同级，左结合）
        // 右操作数：如果是任何表达式，都需要括号（因为 a / (b * c) ≠ a / b * c）
        if (isLeftOperand)
        {
            // 左操作数：如果操作数是加减表达式，需要括号
            if (operandTopOp === 'addsub')
            {
                needsParens = true;
            }
        }
        else
        {
            // 右操作数：如果操作数是任何表达式，都需要括号
            needsParens = true;
        }
    }

    return wrapWithParens(operandStr, needsParens);
}
