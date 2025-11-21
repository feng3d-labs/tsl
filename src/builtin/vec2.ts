import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { Expression, FunctionCallConfig } from './vec4';
import { Expression as ExpressionClass } from './Expression';
import { formatNumber } from './formatNumber';
import { Float } from './float';

/**
 * Vec2 类，用于表示 vec2 字面量值或 uniform/attribute 变量
 */
export class Vec2
{
    private _variableName?: string; // 如果是 uniform/attribute，存储变量名

    constructor(x: number | string, y?: number)
    {
        if (typeof x === 'string' && y === undefined)
        {
            // 从 uniform/attribute 创建
            this._variableName = x;
            this._x = 0; // 占位值，不会被使用
            this._y = 0; // 占位值，不会被使用
        }
        else
        {
            // 从字面量值创建
            this._x = x as number;
            this._y = y as number;
        }
    }

    private _x: number;
    private _y: number;

    /**
     * 获取 x 分量
     */
    get x(): Float
    {
        // 如果是 uniform/attribute，使用变量名
        if (this._variableName)
        {
            return new Float(0, { toGLSL: () => this._variableName!, toWGSL: () => this._variableName! }, 'x');
        }

        return new Float(this._x, this, 'x');
    }

    /**
     * 获取 y 分量
     */
    get y(): Float
    {
        // 如果是 uniform/attribute，使用变量名
        if (this._variableName)
        {
            return new Float(0, { toGLSL: () => this._variableName!, toWGSL: () => this._variableName! }, 'y');
        }

        return new Float(this._y, this, 'y');
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        // 如果是 uniform/attribute，直接返回变量名
        if (this._variableName)
        {
            return this._variableName;
        }

        return `vec2(${formatNumber(this._x)}, ${formatNumber(this._y)})`;
    }

    /**
     * 转换为 WGSL 代码
     */
    toWGSL(): string
    {
        // 如果是 uniform/attribute，直接返回变量名
        if (this._variableName)
        {
            return this._variableName;
        }

        return `vec2<f32>(${formatNumber(this._x)}, ${formatNumber(this._y)})`;
    }
}

/**
 * vec2 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将 FunctionCallConfig 保存到 uniform.value 或 attribute.value
 */
export function vec2(uniform: Uniform): Vec2;
export function vec2(attribute: Attribute): Vec2;
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

        // 返回 Vec2 实例，使用变量名
        return new Vec2(uniformArg.name);
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

        // 返回 Vec2 实例，使用变量名
        return new Vec2(attributeArg.name);
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

