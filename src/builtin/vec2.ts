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

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(x: number, y: number);
    constructor(...args: (number | Uniform | Attribute)[])
    {
        if (args.length === 1)
        {
            // 处理 uniform 或 attribute
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;
                const valueConfig: FunctionCallConfig = {
                    function: 'vec2',
                    args: [uniform.name],
                };
                uniform.value = valueConfig;
                this._variableName = uniform.name;
                this._x = 0; // 占位值，不会被使用
                this._y = 0; // 占位值，不会被使用
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;
                const valueConfig: FunctionCallConfig = {
                    function: 'vec2',
                    args: [attribute.name],
                };
                attribute.value = valueConfig;
                this._variableName = attribute.name;
                this._x = 0; // 占位值，不会被使用
                this._y = 0; // 占位值，不会被使用
            }
            else
            {
                throw new Error('Vec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            // 从字面量值创建
            this._x = args[0];
            this._y = args[1];
        }
        else
        {
            throw new Error('Vec2 constructor: invalid arguments');
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
 */
export function vec2(uniform: Uniform): Vec2;
export function vec2(attribute: Attribute): Vec2;
export function vec2(x: number, y: number): Vec2;
export function vec2(...args: any[]): Vec2
{
    if (args.length === 1) return new Vec2(args[0] as any);
    if (args.length === 2) return new Vec2(args[0] as any, args[1] as any);

    throw new Error('vec2: invalid arguments');
}
