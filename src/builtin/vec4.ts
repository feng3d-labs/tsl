/**
 * 函数调用配置接口
 */
export interface FunctionCallConfig
{
    /** 函数名，如 vec4, vec3, vec2 等 */
    function: string;
    /** 函数参数列表 */
    args: (string | number | FunctionCallConfig)[];
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
export function generateFunctionCallGLSL(call: FunctionCallConfig): string
{
    const args = call.args.map(arg =>
    {
        if (typeof arg === 'string' || typeof arg === 'number')
        {
            return String(arg);
        } else
        {
            // 递归处理嵌套的函数调用
            return generateFunctionCallGLSL(arg);
        }
    }).join(', ');

    return `${call.function}(${args})`;
}

/**
 * 生成 WGSL 函数调用代码
 */
export function generateFunctionCallWGSL(call: FunctionCallConfig): string
{
    const args = call.args.map(arg =>
    {
        if (typeof arg === 'string' || typeof arg === 'number')
        {
            return String(arg);
        } else
        {
            // 递归处理嵌套的函数调用
            return generateFunctionCallWGSL(arg);
        }
    }).join(', ');

    // 对于向量和矩阵构造函数，需要添加类型参数
    const needsTypeParam = /^(vec[234]|ivec[234]|uvec[234]|mat[234]|mat[234]x[234])$/.test(call.function);

    if (needsTypeParam)
    {
        // 确定类型参数
        let typeParam = call.typeParam || 'f32';

        if (call.function.startsWith('ivec'))
        {
            typeParam = 'i32';
        } else if (call.function.startsWith('uvec'))
        {
            typeParam = 'u32';
        }

        // 将 vec4 转换为 vec4<f32>，ivec4 转换为 vec4<i32>，uvec4 转换为 vec4<u32>
        const baseType = call.function.replace(/^(vec|ivec|uvec|mat)/, (match) =>
        {
            if (match.startsWith('ivec')) return 'vec';
            if (match.startsWith('uvec')) return 'vec';

            return match;
        });

        // 构建 WGSL 类型
        const dimension = call.function.match(/\d+/)?.[0] || '';

        if (call.function.startsWith('mat'))
        {
            // 矩阵类型：mat2 -> mat2x2<f32>
            const wgslType = convertTypeToWGSL(baseType);

            return `${wgslType}(${args})`;
        } else
        {
            // 向量类型：vec4 -> vec4<f32>
            return `vec${dimension}<${typeParam}>(${args})`;
        }
    }

    return `${call.function}(${args})`;
}

// 导入 Attribute 和 Uniform 类型（避免循环依赖，使用类型导入）
import type { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { getCurrentShaderInstance } from '../currentShaderInstance';

/**
 * vec2 构造函数
 */
export function vec2(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'vec2',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
    };
}

/**
 * vec3 构造函数
 */
export function vec3(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'vec3',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
    };
}

/**
 * vec4 构造函数
 * 如果传入单个 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
 */
export function vec4(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    // 如果只有一个参数且是 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
    if (args.length === 1 && args[0] instanceof Uniform)
    {
        const uniformArg = args[0] as Uniform;
        const valueConfig: FunctionCallConfig = {
            function: 'vec4',
            args: [uniformArg.name],
        };

        // 更新已存在的 uniform 的 value
        const currentShaderInstance = getCurrentShaderInstance();
        if (currentShaderInstance && currentShaderInstance.uniforms)
        {
            const existingUniform = currentShaderInstance.uniforms[uniformArg.name];
            if (existingUniform)
            {
                // 直接更新现有 uniform 的 value
                existingUniform.value = valueConfig;
            }
        }

        return valueConfig;
    }

    return {
        function: 'vec4',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
    };
}

/**
 * ivec2 构造函数
 */
export function ivec2(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'ivec2',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'i32',
    };
}

/**
 * ivec3 构造函数
 */
export function ivec3(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'ivec3',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'i32',
    };
}

/**
 * ivec4 构造函数
 */
export function ivec4(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'ivec4',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'i32',
    };
}

/**
 * uvec2 构造函数
 */
export function uvec2(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'uvec2',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'u32',
    };
}

/**
 * uvec3 构造函数
 */
export function uvec3(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'uvec3',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'u32',
    };
}

/**
 * uvec4 构造函数
 */
export function uvec4(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    return {
        function: 'uvec4',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
        typeParam: 'u32',
    };
}

