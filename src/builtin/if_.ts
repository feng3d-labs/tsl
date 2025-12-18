import { IStatement } from './Statement';
import { getCurrentFunc } from '../currentFunc';
import { Bool } from './types/bool';
import { IElement } from '../IElement';
import { getCurrentIfStatement, pushIfStatement, popIfStatement } from '../ifStack';

/**
 * if_ 函数，用于条件判断
 * @param condition 条件表达式
 * @param body 条件满足时执行的回调函数
 */
export function if_(condition: Bool, body: () => void): void
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
}

/**
 * IfStatement 类，用于表示 if 语句
 */
export class IfStatement implements IStatement
{
    readonly condition: Bool;
    readonly statements: IStatement[] = [];
    private isBodyActive = false;

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
     * 添加语句到if语句体
     */
    addStatement(statement: IStatement): void
    {
        if (this.isBodyActive)
        {
            this.statements.push(statement);
        }
    }

    toGLSL(): string
    {
        const conditionStr = this.condition.toGLSL();
        const bodyStr = this.statements.map(statement => statement.toGLSL()).join('\n    ');

        return `if (${conditionStr}) {\n    ${bodyStr}\n}`;
    }

    toWGSL(): string
    {
        const conditionStr = this.condition.toWGSL();
        const bodyStr = this.statements.map(statement => statement.toWGSL()).join('\n    ');

        return `if (${conditionStr}) {\n    ${bodyStr}\n}`;
    }
}
