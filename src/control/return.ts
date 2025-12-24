import { getBuildParam } from '../core/buildShader';
import { IElement, ShaderValue } from '../core/IElement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function return_<T extends ShaderValue>(expr: T): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        const stmt: any = {
            toGLSL: () =>
            {
                const buildParam = getBuildParam();
                const version = buildParam.version;
                const stage = buildParam.stage;

                if (stage === 'vertex')
                {
                    return `gl_Position = ${expr.toGLSL()}; return;`;
                }
                else if (stage === 'fragment')
                {
                    if (version === 2)
                    {
                        // WebGL 2.0 使用 layout(location = 0) out vec4 color;
                        return `color = ${expr.toGLSL()}; return;`;
                    }
                    else
                    {
                        return `gl_FragColor = ${expr.toGLSL()}; return;`;
                    }
                }

                return `return ${expr.toGLSL()};`;
            },
            toWGSL: () =>
            {
                return `return ${expr.toWGSL()};`;
            },
        };

        // 保存原始表达式，用于 fragment shader 中自动创建结构体
        stmt._returnExpr = expr;
        // 标记这是一个 return 语句，用于 fragment.ts 检查
        stmt._isReturn = true;

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
        currentFunc.dependencies.push(expr);
    }
}

