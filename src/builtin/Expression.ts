import { FunctionCallConfig } from './vec4';

/**
 * 表达式类，用于链式调用
 */
export class Expression
{
    private _config: FunctionCallConfig;
    private _varName?: string; // 通过 as() 或 _let() 设置的变量名

    constructor(config: FunctionCallConfig, varName?: string)
    {
        this._config = config;
        this._varName = varName;
    }

    /**
     * 获取底层的 FunctionCallConfig
     */
    get config(): FunctionCallConfig
    {
        return this._config;
    }

    /**
     * 获取变量名（如果通过 as() 设置）
     */
    get varName(): string | undefined
    {
        return this._varName;
    }

    /**
     * 给表达式命名（用于 WGSL 中的 let 语句）
     * @param name 变量名
     * @returns Expression 实例
     * @deprecated 使用 _let() 函数代替
     */
    as(name: string): Expression
    {
        return new Expression(this._config, name);
    }

    /**
     * 矩阵/向量乘法
     * @param other 另一个表达式
     * @returns Expression 实例
     */
    multiply(other: Expression | FunctionCallConfig | string | number): Expression
    {
        // 将当前表达式转换为用于乘法的表达式
        // 如果有变量名，使用变量名；否则使用 config
        const leftExpr: Expression | FunctionCallConfig | string = this._varName ? this._varName : this;

        // 处理右侧表达式
        let rightExpr: Expression | FunctionCallConfig | string | number;
        if (other instanceof Expression)
        {
            rightExpr = other._varName ? other._varName : other;
        }
        else
        {
            rightExpr = other;
        }

        // 创建一个表示乘法的 FunctionCallConfig
        // 使用特殊的 function 名 "*" 来表示操作符
        const multiplyConfig: FunctionCallConfig = {
            function: '*',
            args: [leftExpr, rightExpr],
        };

        return new Expression(multiplyConfig);
    }

    /**
     * 转换为字符串（用于在字符串表达式中使用）
     */
    toString(): string
    {
        if (this._varName)
        {
            return this._varName;
        }
        // 如果是操作符表达式，需要特殊处理
        if (this._config.function === '*')
        {
            const left = this._config.args[0];
            const right = this._config.args[1];
            const leftStr = left instanceof Expression ? left.toString() : (typeof left === 'object' && 'name' in left ? left.name : String(left));
            const rightStr = right instanceof Expression ? right.toString() : (typeof right === 'object' && 'name' in right ? right.name : String(right));
            return `${leftStr} * ${rightStr}`;
        }
        // 否则返回配置的字符串表示
        return typeof this._config === 'string' ? this._config : (this._config.function || '');
    }
}

/**
 * 将 FunctionCallConfig 包装为 Expression
 */
export function expr(config: FunctionCallConfig): Expression
{
    return new Expression(config);
}

