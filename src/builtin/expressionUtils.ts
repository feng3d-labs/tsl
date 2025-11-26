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
    const hasAddSub = hasAddSubOperator(operandStr);
    const hasMulDiv = hasMulDivOperator(operandStr);

    let needsParens = false;

    if (currentOp === '+' || currentOp === '-')
    {
        // 加减运算：如果操作数是乘除表达式，需要括号
        if (hasMulDiv)
        {
            needsParens = true;
        }
    }
    else if (currentOp === '*' || currentOp === '/')
    {
        // 乘除运算：如果操作数是加减表达式，需要括号
        if (hasAddSub)
        {
            needsParens = true;
        }
        // 除法时，如果右操作数是任何表达式，需要括号
        if (currentOp === '/' && !isLeftOperand && hasOp)
        {
            needsParens = true;
        }
    }

    return wrapWithParens(operandStr, needsParens);
}
