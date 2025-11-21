import { Attribute, ATTRIBUTE_SYMBOL } from './Attribute';
import { Uniform, UNIFORM_SYMBOL } from './Uniform';
import type { FuncDef } from './Vertex';
import { FUNC_SYMBOL } from './Vertex';
import { getCurrentShaderInstance } from './currentShaderInstance';
import { AttributeConfig } from './shaderGenerator';
import { UniformConfig } from './uniforms';

/**
 * 检查对象是否为 Uniform 定义
 */
export function isUniformDef(obj: any): obj is Uniform
{
    return obj && typeof obj === 'object' && obj.__type__ === UNIFORM_SYMBOL;
}

/**
 * 检查对象是否为 Attribute 定义
 */
export function isAttributeDef(obj: any): obj is Attribute
{
    return obj && typeof obj === 'object' && obj.__type__ === ATTRIBUTE_SYMBOL;
}

/**
 * 从 Uniform 定义转换为 UniformConfig
 */
export function uniformDefToConfig(def: Uniform): UniformConfig
{
    return def.toConfig();
}

/**
 * 从 Attribute 定义转换为 AttributeConfig
 */
export function attributeDefToConfig(def: Attribute): AttributeConfig
{
    return def.toConfig();
}

/**
 * 定义函数（通用函数，不指定着色器类型）
 * @param name 函数名
 * @param body 函数体
 * @returns 函数定义对象
 */
export function func(name: string, body: () => any): FuncDef
{
    return {
        __type__: FUNC_SYMBOL,
        name,
        body,
    };
}

/**
 * 检查对象是否为函数定义
 */
export function isFuncDef(obj: any): obj is FuncDef
{
    return obj && typeof obj === 'object' && obj.__type__ === FUNC_SYMBOL;
}

/**
 * 设置 GLSL 精度（仅用于 fragment shader）
 * @param value 精度：'lowp' | 'mediump' | 'highp'
 */
export function precision(value: 'lowp' | 'mediump' | 'highp'): void
{
    // 如果当前正在构造 Shader 实例，设置 precision
    const currentShaderInstance = getCurrentShaderInstance();
    if (currentShaderInstance && typeof currentShaderInstance.precision !== 'undefined')
    {
        currentShaderInstance.precision = value;
    }
}


