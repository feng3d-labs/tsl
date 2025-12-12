import { ShaderValue } from '../IElement';
import { getBuildParam } from '../buildShader';
import { getCurrentFunc } from '../currentFunc';
import { getCurrentIfStatement } from '../ifStack';
import { Builtin } from './builtin';
import { IStatement } from './Statement';

/**
 * Assign 类，表示赋值语句
 * @internal 库外部不应直接使用 `new Assign()`，应使用 `assign()` 函数
 */
export class Assign implements IStatement
{
    readonly target: ShaderValue;
    readonly value: ShaderValue;

    constructor(target: ShaderValue, value: ShaderValue)
    {
        this.target = target;
        this.value = value;

        // 将语句添加到当前函数的 statements 中，或当前 if 语句的 statements 中
        const currentFunc = getCurrentFunc();
        if (currentFunc)
        {
            // 检查当前是否在if语句体中
            const currentIfStatement = getCurrentIfStatement();
            if (currentIfStatement)
            {
                // 如果当前在if语句体中，将语句添加到当前if语句的statements中
                currentIfStatement.statements.push(this);
            }
            else
            {
                // 否则将语句添加到当前函数的statements中
                currentFunc.statements.push(this);
            }
            // 收集依赖（包括 target 和 value）
            currentFunc.dependencies.push(target);
            currentFunc.dependencies.push(value);
        }
    }

    toGLSL(): string
    {
        return `${this.target.toGLSL()} = ${this.value.toGLSL()};`;
    }

    toWGSL(): string
    {
        // 在 WGSL 中，如果是 vertex shader 的 position，需要特殊处理
        const isPositionBuiltin = this.target instanceof Builtin && this.target.isPosition;
        if (isPositionBuiltin && getBuildParam().stage === 'vertex')
        {
            // 在 vertex shader 中，position 是返回值，使用 return
            return `return ${this.value.toWGSL()};`;
        }
        else
        {
            return `${this.target.toWGSL()} = ${this.value.toWGSL()};`;
        }
    }
}

/**
 * 赋值操作（用于对内置变量进行赋值）
 * @param target 目标变量（Builtin 实例或 Varying）
 * @param value 要赋值的表达式（必须与 target 类型完全相同）
 */
export function assign<T extends ShaderValue>(target: T, value: T): void
{
    new Assign(target, value);
}

