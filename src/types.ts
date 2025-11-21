import type { FunctionCallConfig } from './builtin/vec4';
import type { MainFunctionConfig } from './main';
import type { AttributeConfig } from './shaderGenerator';
import type { UniformConfig } from './uniforms';

/**
 * Fragment Shader 配置类型（严格类型）
 * 与 ShaderConfig 兼容，但 type 字段被限制为 'fragment'
 */
export interface FragmentShaderConfig
{
    /** 着色器类型，必须为 'fragment' */
    readonly type: 'fragment';
    /** GLSL 精度声明（仅用于 fragment shader） */
    readonly precision?: 'lowp' | 'mediump' | 'highp' | string;
    /** 统一变量列表 */
    readonly uniforms?: readonly FragmentUniformConfig[] | UniformConfig[];
    /** 属性变量列表（通常不用于 fragment shader，但允许定义） */
    readonly attributes?: readonly FragmentAttributeConfig[] | AttributeConfig[];
    /** 主函数配置 */
    readonly main: FragmentMainFunctionConfig | MainFunctionConfig;
}

/**
 * Vertex Shader 配置类型（严格类型）
 * 与 ShaderConfig 兼容，但 type 字段被限制为 'vertex'
 */
export interface VertexShaderConfig
{
    /** 着色器类型，必须为 'vertex' */
    readonly type: 'vertex';
    /** GLSL 精度声明（通常不用于 vertex shader，但允许定义） */
    readonly precision?: 'lowp' | 'mediump' | 'highp' | string;
    /** 统一变量列表 */
    readonly uniforms?: readonly VertexUniformConfig[] | UniformConfig[];
    /** 属性变量列表（用于 vertex shader） */
    readonly attributes?: readonly VertexAttributeConfig[] | AttributeConfig[];
    /** 主函数配置 */
    readonly main: VertexMainFunctionConfig | MainFunctionConfig;
}

/**
 * Fragment Shader 统一变量配置
 */
export interface FragmentUniformConfig
{
    /** 变量名 */
    readonly name: string;
    /** 类型：vec2, vec3, vec4, float, int, mat2, mat3, mat4 等 */
    readonly type: string;
    /** WGSL 绑定位置 */
    readonly binding?: number;
    /** WGSL 绑定组 */
    readonly group?: number;
}

/**
 * Vertex Shader 统一变量配置
 */
export interface VertexUniformConfig
{
    /** 变量名 */
    readonly name: string;
    /** 类型：vec2, vec3, vec4, float, int, mat2, mat3, mat4 等 */
    readonly type: string;
    /** WGSL 绑定位置 */
    readonly binding?: number;
    /** WGSL 绑定组 */
    readonly group?: number;
}

/**
 * Fragment Shader 属性变量配置
 */
export interface FragmentAttributeConfig
{
    /** 变量名 */
    readonly name: string;
    /** 类型：vec2, vec3, vec4, float 等 */
    readonly type: string;
    /** WGSL location */
    readonly location?: number;
}

/**
 * Vertex Shader 属性变量配置
 */
export interface VertexAttributeConfig
{
    /** 变量名 */
    readonly name: string;
    /** 类型：vec2, vec3, vec4, float 等 */
    readonly type: string;
    /** WGSL location */
    readonly location?: number;
}

/**
 * Fragment Shader 主函数配置
 */
export interface FragmentMainFunctionConfig
{
    /** 返回值表达式（字符串形式或函数调用对象形式） */
    readonly return?: string | FunctionCallConfig;
    /** 函数体代码（可选，如果提供则使用此代码，否则使用 return） */
    readonly body?: string;
}

/**
 * Vertex Shader 主函数配置
 */
export interface VertexMainFunctionConfig
{
    /** 返回值表达式（字符串形式或函数调用对象形式） */
    readonly return?: string | FunctionCallConfig;
    /** 函数体代码（可选，如果提供则使用此代码，否则使用 return） */
    readonly body?: string;
}

