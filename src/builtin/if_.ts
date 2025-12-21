import { IStatement } from './Statement';
import { getCurrentFunc } from '../currentFunc';
import { Bool } from './types/bool';
import { IElement } from '../IElement';
import { getCurrentIfStatement, pushIfStatement, popIfStatement } from '../ifStack';

/**
 * if_ 返回值接口，支持链式调用 else
 */
export interface IfResult
{
    /**
     * else 分支
     * @param body else 分支执行的回调函数
     */
    else(body: () => void): void;
}

/**
 * if_ 函数，用于条件判断
 * @param condition 条件表达式
 * @param body 条件满足时执行的回调函数
 * @returns 支持链式调用 else 的对象
 */
export function if_(condition: Bool, body: () => void): IfResult
{
    // 创建一个IfStatement实例，用于生成条件判断代码
    const ifStatement = new IfStatement(condition);

    // 将语句添加到当前函数的 statements 中
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        // 检查当前是否在if语句体中
        const currentIfStatement = getCurrentIfStatement();
        if (currentIfStatement)
        {
            // 如果当前在if语句体中，将新的if语句添加到当前if语句的statements中
            currentIfStatement.statements.push(ifStatement);
        }
        else
        {
            // 否则将新的if语句添加到当前函数的statements中
            currentFunc.statements.push(ifStatement);
        }
        // 收集条件表达式的依赖
        currentFunc.dependencies.push(condition);

        // 执行回调函数，收集要执行的语句
        pushIfStatement(ifStatement); // 将当前if语句推入堆栈
        ifStatement.beginBody();
        body();
        ifStatement.endBody();
        popIfStatement(); // 从堆栈中移除当前if语句
    }

    // 返回支持链式调用的对象
    return {
        else(elseBody: () => void): void
        {
            if (currentFunc)
            {
                pushIfStatement(ifStatement);
                ifStatement.beginElseBody();
                elseBody();
                ifStatement.endElseBody();
                popIfStatement();
            }
        },
    };
}

/**
 * IfStatement 类，用于表示 if 语句
 */
export class IfStatement implements IStatement
{
    readonly condition: Bool;
    readonly statements: IStatement[] = [];
    readonly elseStatements: IStatement[] = [];
    private isBodyActive = false;
    private isElseBodyActive = false;

    constructor(condition: Bool)
    {
        this.condition = condition;
    }

    /**
     * 开始收集if语句体
     */
    beginBody(): void
    {
        this.isBodyActive = true;
    }

    /**
     * 结束收集if语句体
     */
    endBody(): void
    {
        this.isBodyActive = false;
    }

    /**
     * 开始收集else语句体
     */
    beginElseBody(): void
    {
        this.isElseBodyActive = true;
    }

    /**
     * 结束收集else语句体
     */
    endElseBody(): void
    {
        this.isElseBodyActive = false;
    }

    /**
     * 添加语句到if语句体
     */
    addStatement(statement: IStatement): void
    {
        if (this.isBodyActive)
        {
            this.statements.push(statement);
        }
        else if (this.isElseBodyActive)
        {
            this.elseStatements.push(statement);
        }
    }

    toGLSL(): string
    {
        const conditionStr = this.condition.toGLSL();
        // 为每个语句生成代码，并处理多行语句的缩进
        const bodyLines: string[] = [];
        for (const statement of this.statements)
        {
            const stmtStr = statement.toGLSL();
            // 如果语句包含多行，为每行添加缩进
            const lines = stmtStr.split('\n');
            for (const line of lines)
            {
                bodyLines.push(`    ${line}`);
            }
        }

        let result = `if (${conditionStr}) {\n${bodyLines.join('\n')}\n}`;

        // 生成 else 分支代码
        if (this.elseStatements.length > 0)
        {
            const elseLines: string[] = [];
            for (const statement of this.elseStatements)
            {
                const stmtStr = statement.toGLSL();
                const lines = stmtStr.split('\n');
                for (const line of lines)
                {
                    elseLines.push(`    ${line}`);
                }
            }
            result += ` else {\n${elseLines.join('\n')}\n}`;
        }

        return result;
    }

    toWGSL(): string
    {
        const conditionStr = this.condition.toWGSL();
        // 为每个语句生成代码，并处理多行语句的缩进
        const bodyLines: string[] = [];
        for (const statement of this.statements)
        {
            const stmtStr = statement.toWGSL();
            // 如果语句包含多行，为每行添加缩进
            const lines = stmtStr.split('\n');
            for (const line of lines)
            {
                bodyLines.push(`    ${line}`);
            }
        }

        let result = `if (${conditionStr}) {\n${bodyLines.join('\n')}\n}`;

        // 生成 else 分支代码
        if (this.elseStatements.length > 0)
        {
            const elseLines: string[] = [];
            for (const statement of this.elseStatements)
            {
                const stmtStr = statement.toWGSL();
                const lines = stmtStr.split('\n');
                for (const line of lines)
                {
                    elseLines.push(`    ${line}`);
                }
            }
            result += ` else {\n${elseLines.join('\n')}\n}`;
        }

        return result;
    }
}
