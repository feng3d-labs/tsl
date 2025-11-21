import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { Expression, FunctionCallConfig } from './vec4';
import { Expression as ExpressionClass } from './Expression';

/**
 * Vec2 类，用于表示 vec2 字面量值
 */
export class Vec2
{
    constructor(private _x: number, private _y: number)
    {
    }

    /**
     * 获取 x 分量
     */
    get x(): number
    {
        return this._x;
    }

    /**
     * 获取 y 分量
     */
    get y(): number
    {
        return this._y;
    }

    /**
     * 格式化数字为 GLSL 格式
     * 正数整数保留 .0，负数整数不保留 .0
     */
    private formatNumberForGLSL(num: number): string
    {
        // 如果是正数整数，添加 .0 后缀
        if (Number.isInteger(num) && num >= 0)
        {
            return `${num}.0`;
        }

        // 负数整数或浮点数直接转换为字符串
        return String(num);
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        return `vec2(${this.formatNumberForGLSL(this._x)}, ${this.formatNumberForGLSL(this._y)})`;
    }

    /**
     * 转换为 WGSL 代码
     */
    toWGSL(): string
    {
        return `vec2<f32>(${this._x}, ${this._y})`;
    }
}

/**
 * vec2 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将 FunctionCallConfig 保存到 uniform.value 或 attribute.value
 */
export function vec2(uniform: Uniform): Expression;
export function vec2(attribute: Attribute): Expression;
export function vec2(x: number, y: number): Vec2;
export function vec2(...args: (string | number | FunctionCallConfig | Expression | Attribute | Uniform)[]): Vec2 | Expression
{
    // 处理 vec2(x: number, y: number) 的情况
    if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
    {
        return new Vec2(args[0], args[1]);
    }

    // 如果只有一个参数且是 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
    if (args.length === 1 && args[0] instanceof Uniform)
    {
        const uniformArg = args[0] as Uniform;
        const valueConfig: FunctionCallConfig = {
            function: 'vec2',
            args: [uniformArg.name],
        };

        // 直接更新 uniform 的 value
        uniformArg.value = valueConfig;

        return new ExpressionClass(valueConfig);
    }

    // 如果只有一个参数且是 Attribute 实例，则将 FunctionCallConfig 保存到 attribute.value
    if (args.length === 1 && args[0] instanceof Attribute)
    {
        const attributeArg = args[0] as Attribute;
        const valueConfig: FunctionCallConfig = {
            function: 'vec2',
            args: [attributeArg.name],
        };

        // 直接更新 attribute 的 value
        attributeArg.value = valueConfig;

        return new ExpressionClass(valueConfig);
    }

    // 处理其他情况（多个参数，可能是 Expression 或其他类型）
    const config: FunctionCallConfig = {
        function: 'vec2',
        args: args.map((arg: string | number | FunctionCallConfig | Expression | Attribute | Uniform): string | number | FunctionCallConfig | Expression =>
        {
            // 检查是否是 Expression 实例
            if (arg && typeof arg === 'object' && 'config' in arg && 'varName' in arg)
            {
                return (arg as Expression).config;
            }

            // 检查是否有 name 属性（Uniform 或 Attribute）
            if (typeof arg === 'object' && arg !== null && 'name' in arg)
            {
                return (arg as { name: string }).name;
            }

            // 其他情况（string, number, FunctionCallConfig）
            return arg as string | number | FunctionCallConfig | Expression;
        }),
    };

    return new ExpressionClass(config);
}

