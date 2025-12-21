import { getBuildParam } from '../buildShader';
import { IElement, ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { FragmentOutput } from '../fragmentOutput';
import { getCurrentIfStatement } from '../ifStack';

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式，可以是 ShaderValue 或 FragmentOutput
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function return_<T extends ShaderValue | FragmentOutput<any>>(expr: T): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        // 检查是否是 FragmentOutput 实例
        const isFragmentOutput = expr instanceof FragmentOutput ||
            (typeof expr === 'object' && expr !== null && (expr as any)._fragmentOutput instanceof FragmentOutput);

        const stmt: any = {
            toGLSL: () =>
            {
                // 如果是 FragmentOutput，在 GLSL 中只生成 return;（输出已通过 assign 设置）
                if (isFragmentOutput)
                {
                    return 'return;';
                }

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
                // 如果是 FragmentOutput，在 WGSL 中返回 output 变量
                if (isFragmentOutput)
                {
                    return 'return output;';
                }

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
            // 如果在 if 语句体中，将语句添加到当前 if 语句的 statements 中
            currentIfStatement.statements.push(stmt);
        }
        else
        {
            // 否则将语句添加到当前函数的 statements 中
            currentFunc.statements.push(stmt);
        }
        currentFunc.dependencies.push(expr);
    }
}

