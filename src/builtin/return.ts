import { getBuildParam } from '../buildShader';
import { ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { VaryingStruct } from '../varyingStruct';

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
        // 检查是否是结构体变量（通过检查 dependencies 中是否包含 VaryingStruct 实例）
        const isStructVar = expr.dependencies && expr.dependencies.some(dep => dep instanceof VaryingStruct);

        const stmt: any = {
            toGLSL: () =>
            {
                // 如果是结构体变量，在 GLSL 中只生成 return;（输出已通过 assign 设置）
                if (isStructVar)
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
            toWGSL: () => `return ${expr.toWGSL()};`,
        };

        // 保存原始表达式，用于 fragment shader 中自动创建结构体
        stmt._returnExpr = expr;

        currentFunc.statements.push(stmt);
        currentFunc.dependencies.push(expr);
    }
}

