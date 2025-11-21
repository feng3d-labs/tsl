import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { Expression } from './Expression';

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
        if (typeof arg === 'string' || typeof arg === 'number')
        {
            return String(arg);
        }
        if (arg instanceof Expression)
        {
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
 * vec4 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将 FunctionCallConfig 保存到 uniform.value 或 attribute.value
 */
export function vec4(uniform: Uniform): Expression;
export function vec4(attribute: Attribute): Expression;
export function vec4(...args: (string | number | FunctionCallConfig | Expression)[]): Expression;
export function vec4(...args: (string | number | FunctionCallConfig | Expression | Attribute | Uniform)[]): Expression
{
    // 如果只有一个参数且是 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
    if (args.length === 1 && args[0] instanceof Uniform)
    {
        const uniformArg = args[0] as Uniform;
        const valueConfig: FunctionCallConfig = {
            function: 'vec4',
            args: [uniformArg.name],
        };

        // 直接更新 uniform 的 value
        uniformArg.value = valueConfig;

        return new Expression(valueConfig);
    }

    // 如果只有一个参数且是 Attribute 实例，则将 FunctionCallConfig 保存到 attribute.value
    if (args.length === 1 && args[0] instanceof Attribute)
    {
        const attributeArg = args[0] as Attribute;
        const valueConfig: FunctionCallConfig = {
            function: 'vec4',
            args: [attributeArg.name],
        };

        // 直接更新 attribute 的 value
        attributeArg.value = valueConfig;

        return new Expression(valueConfig);
    }

    const config: FunctionCallConfig = {
        function: 'vec4',
        args: args.map(arg => {
            if (arg instanceof Expression)
            {
                return arg.config;
            }

            return typeof arg === 'object' && ('name' in arg) ? arg.name : arg;
        }),
    };

    return new Expression(config);
}
