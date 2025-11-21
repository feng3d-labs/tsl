import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { Expression } from './Expression';
import { formatNumber } from './formatNumber';
import { Vec2 } from './vec2';

// 导出 Expression 以供其他文件使用
export { Expression } from './Expression';

/**
 * 函数调用配置接口
 */
export interface FunctionCallConfig
{
    /** 函数名，如 vec4, vec3, vec2 等 */
    function: string;
    /** 函数参数列表 */
    args: (string | number | FunctionCallConfig | Expression)[];
    /** 类型参数（仅用于 WGSL，如 f32, i32, u32） */
    typeParam?: 'f32' | 'i32' | 'u32';
}

/**
 * 类型映射：GLSL 类型到 WGSL 类型
 */
const typeMap: Record<string, string> = {
    float: 'f32',
    int: 'i32',
    uint: 'u32',
    bool: 'bool',
    vec2: 'vec2<f32>',
    vec3: 'vec3<f32>',
    vec4: 'vec4<f32>',
    ivec2: 'vec2<i32>',
    ivec3: 'vec3<i32>',
    ivec4: 'vec4<i32>',
    uvec2: 'vec2<u32>',
    uvec3: 'vec3<u32>',
    uvec4: 'vec4<u32>',
    bvec2: 'vec2<bool>',
    bvec3: 'vec3<bool>',
    bvec4: 'vec4<bool>',
    mat2: 'mat2x2<f32>',
    mat3: 'mat3x3<f32>',
    mat4: 'mat4x4<f32>',
};

/**
 * 将 GLSL 类型转换为 WGSL 类型
 */
export function convertTypeToWGSL(glslType: string): string
{
    return typeMap[glslType] || glslType;
}

/**
 * 生成 GLSL 函数调用代码
 */
export function generateFunctionCallGLSL(call: FunctionCallConfig | Expression): string
{
    // 如果是 Expression，提取 config
    const config = call instanceof Expression ? call.config : call;

    // 处理操作符
    if (config.function === '*')
    {
        const left = config.args[0];
        const right = config.args[1];
        const leftStr = left instanceof Expression ? generateExpressionGLSL(left) : (typeof left === 'object' && 'function' in left ? generateFunctionCallGLSL(left) : String(left));
        const rightStr = right instanceof Expression ? generateExpressionGLSL(right) : (typeof right === 'object' && 'function' in right ? generateFunctionCallGLSL(right) : String(right));

        return `${leftStr} * ${rightStr}`;
    }

    const args = config.args.map(arg =>
    {
        if (typeof arg === 'string' || typeof arg === 'number')
        {
            return String(arg);
        }
        if (arg instanceof Expression)
        {
            return generateExpressionGLSL(arg);
        }

        // 递归处理嵌套的函数调用
        return generateFunctionCallGLSL(arg);
    }).join(', ');

    return `${config.function}(${args})`;
}

/**
 * 生成 Expression 的 GLSL 代码
 */
function generateExpressionGLSL(expr: Expression): string
{
    if (expr.varName)
    {
        return expr.varName;
    }

    return generateFunctionCallGLSL(expr.config);
}

/**
 * 生成 WGSL 函数调用代码
 */
export function generateFunctionCallWGSL(call: FunctionCallConfig | Expression): string
{
    // 如果是 Expression，提取 config
    const config = call instanceof Expression ? call.config : call;

    // 处理操作符
    if (config.function === '*')
    {
        const left = config.args[0];
        const right = config.args[1];
        const leftStr = left instanceof Expression ? generateExpressionWGSL(left) : (typeof left === 'object' && 'function' in left ? generateFunctionCallWGSL(left) : String(left));
        const rightStr = right instanceof Expression ? generateExpressionWGSL(right) : (typeof right === 'object' && 'function' in right ? generateFunctionCallWGSL(right) : String(right));

        return `${leftStr} * ${rightStr}`;
    }

    const args = config.args.map(arg =>
    {
        if (typeof arg === 'string')
        {
            return arg;
        }

        if (typeof arg === 'number')
        {
            // 使用 formatNumber 格式化数字
            return formatNumber(arg);
        }

        if (arg instanceof Expression)
        {
            // 如果 Expression 是简单的 uniform/attribute 引用，直接返回其名称
            if (arg.config.args.length === 1 && typeof arg.config.args[0] === 'string')
            {
                return arg.config.args[0];
            }

            return generateExpressionWGSL(arg);
        }

        // 递归处理嵌套的函数调用
        return generateFunctionCallWGSL(arg);
    }).join(', ');

    // 如果有类型参数，使用类型参数；否则根据函数名推断
    if (config.typeParam)
    {
        const typeParam = config.typeParam;
        const functionName = config.function;

        // 检查是否是向量类型（vec2, vec3, vec4, ivec2, ivec3, ivec4, uvec2, uvec3, uvec4）
        const vecMatch = functionName.match(/^(i|u)?vec(\d)$/);
        if (vecMatch)
        {
            const dimension = vecMatch[2];

            return `vec${dimension}<${typeParam}>(${args})`;
        }

        // 检查是否是矩阵类型
        const matMatch = functionName.match(/^mat(\d)$/);
        if (matMatch)
        {
            const dimension = matMatch[1];

            return `mat${dimension}x${dimension}<${typeParam}>(${args})`;
        }

        // 其他类型：直接使用类型参数
        return `${functionName}<${typeParam}>(${args})`;
    }

    // 如果没有类型参数，根据函数名推断类型
    const functionName = config.function;
    const vecMatch = functionName.match(/^(i|u)?vec(\d)$/);
    if (vecMatch)
    {
        const prefix = vecMatch[1] || '';
        const dimension = vecMatch[2];
        let typeParam: string;

        if (prefix === 'i')
        {
            typeParam = 'i32';
        }
        else if (prefix === 'u')
        {
            typeParam = 'u32';
        }
        else
        {
            typeParam = 'f32';
        }

        // 检查是否是基本类型（如 float, int, uint, bool）
        const wgslType = convertTypeToWGSL(functionName);
        if (wgslType !== functionName)
        {
            // 是基本类型，直接使用转换后的类型
            return `${wgslType}(${args})`;
        } else
        {
            // 向量类型：vec4 -> vec4<f32>
            return `vec${dimension}<${typeParam}>(${args})`;
        }
    }

    // 检查是否是矩阵类型
    const matMatch = functionName.match(/^mat(\d)$/);
    if (matMatch)
    {
        const dimension = matMatch[1];
        const typeParam = 'f32'; // 矩阵默认使用 f32

        return `mat${dimension}x${dimension}<${typeParam}>(${args})`;
    }

    return `${config.function}(${args})`;
}

/**
 * 生成 Expression 的 WGSL 代码
 */
function generateExpressionWGSL(expr: Expression): string
{
    if (expr.varName)
    {
        return expr.varName;
    }

    return generateFunctionCallWGSL(expr.config);
}

/**
 * Vec4 类型，表示 vec4 字面量值
 */
export class Vec4 extends Expression
{
    private _variableName?: string; // 如果是 uniform/attribute，存储变量名
    private _x: number;
    private _y: number;
    private _z: number;
    private _w: number;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(xy: Vec2, z: number, w: number);
    constructor(x: number, y: number, z: number, w: number);
    constructor(...args: (number | Uniform | Attribute | Vec2)[])
    {
        if (args.length === 1)
        {
            // 处理 uniform 或 attribute
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;
                const valueConfig: FunctionCallConfig = {
                    function: 'vec4',
                    args: [uniform.name],
                };
                uniform.value = valueConfig;
                const config: FunctionCallConfig = {
                    function: 'vec4',
                    args: [uniform.name],
                };
                super(config);
                this._variableName = uniform.name;
                this._x = 0; // 占位值，不会被使用
                this._y = 0; // 占位值，不会被使用
                this._z = 0; // 占位值，不会被使用
                this._w = 0; // 占位值，不会被使用
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;
                const valueConfig: FunctionCallConfig = {
                    function: 'vec4',
                    args: [attribute.name],
                };
                attribute.value = valueConfig;
                const config: FunctionCallConfig = {
                    function: 'vec4',
                    args: [attribute.name],
                };
                super(config);
                this._variableName = attribute.name;
                this._x = 0; // 占位值，不会被使用
                this._y = 0; // 占位值，不会被使用
                this._z = 0; // 占位值，不会被使用
                this._w = 0; // 占位值，不会被使用
            }
            else
            {
                throw new Error('Vec4 constructor: invalid argument');
            }
        }
        else if (args.length === 3 && args[0] instanceof Vec2 && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            // 处理 vec4(xy: Vec2, z: number, w: number) 的情况
            const xy = args[0] as Vec2;
            const z = args[1] as number;
            const w = args[2] as number;

            // 检查 Vec2 是否是 uniform/attribute 变量
            const variableName = (xy as any)._variableName;

            if (variableName)
            {
                // 如果是变量，生成表达式 vec4(variableName, z, w)
                const config: FunctionCallConfig = {
                    function: 'vec4',
                    args: [variableName, formatNumber(z), formatNumber(w)],
                };
                super(config);
                this._variableName = undefined;
                this._x = 0; // 占位值，不会被使用
                this._y = 0; // 占位值，不会被使用
                this._z = z;
                this._w = w;
            }
            else
            {
                // 如果是字面量，提取 x 和 y 值
                const x = (xy as any)._x;
                const y = (xy as any)._y;
                const config: FunctionCallConfig = {
                    function: 'vec4',
                    args: [x, y, z, w],
                };
                super(config);
                this._x = x;
                this._y = y;
                this._z = z;
                this._w = w;
            }
        }
        else if (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number' && typeof args[3] === 'number')
        {
            // 从字面量值创建
            const config: FunctionCallConfig = {
                function: 'vec4',
                args: [args[0], args[1], args[2], args[3]],
            };
            super(config);
            this._x = args[0];
            this._y = args[1];
            this._z = args[2];
            this._w = args[3];
        }
        else
        {
            throw new Error('Vec4 constructor: invalid arguments');
        }
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
     * 获取 z 分量
     */
    get z(): number
    {
        return this._z;
    }

    /**
     * 获取 w 分量
     */
    get w(): number
    {
        return this._w;
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

        // 如果 config 中包含字符串参数（如变量名），使用 generateFunctionCallGLSL
        if (this.config.args.some(arg => typeof arg === 'string' && !/^\d/.test(arg)))
        {
            return generateFunctionCallGLSL(this.config);
        }

        return `vec4(${formatNumber(this._x)}, ${formatNumber(this._y)}, ${formatNumber(this._z)}, ${formatNumber(this._w)})`;
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

        // 如果 config 中包含字符串参数（如变量名），使用 generateFunctionCallWGSL
        if (this.config.args.some(arg => typeof arg === 'string' && !/^\d/.test(arg)))
        {
            return generateFunctionCallWGSL(this.config);
        }

        return `vec4<f32>(${formatNumber(this._x)}, ${formatNumber(this._y)}, ${formatNumber(this._z)}, ${formatNumber(this._w)})`;
    }

    /**
     * 矩阵/向量乘法
     * @param other 另一个表达式
     * @returns Expression 实例
     */
    multiply(other: Expression | FunctionCallConfig | string | number): Expression
    {
        return super.multiply(other);
    }
}

/**
 * vec4 构造函数
 * 直接调用 Vec4 构造函数，所有参数处理逻辑都在 Vec4 构造函数中
 */
export function vec4(uniform: Uniform): Vec4;
export function vec4(attribute: Attribute): Vec4;
export function vec4(xy: Vec2, z: number, w: number): Vec4;
export function vec4(x: number, y: number, z: number, w: number): Vec4;
export function vec4(...args: any[]): Vec4
{
    if (args.length === 1) return new Vec4(args[0] as any);
    if (args.length === 3) return new Vec4(args[0] as any, args[1] as any, args[2] as any);
    if (args.length === 4) return new Vec4(args[0] as any, args[1] as any, args[2] as any, args[3] as any);

    throw new Error('vec4: invalid arguments');
}
