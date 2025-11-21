import { UniformConfig } from './uniforms';
import { AttributeConfig } from './shaderGenerator';

/**
 * Uniform 定义标记
 */
const UNIFORM_SYMBOL = Symbol('uniform');
const ATTRIBUTE_SYMBOL = Symbol('attribute');
const FUNC_SYMBOL = Symbol('func');

/**
 * Uniform 定义对象接口
 */
export interface UniformDef
{
    __type__: typeof UNIFORM_SYMBOL;
    name: string;
    type: string;
    binding?: number;
    group?: number;
}

/**
 * Attribute 定义对象接口
 */
export interface AttributeDef
{
    __type__: typeof ATTRIBUTE_SYMBOL;
    name: string;
    type: string;
    location?: number;
}

/**
 * 定义 uniform 变量
 * @param name 变量名
 * @param type 类型：vec2, vec3, vec4, float, int, mat2, mat3, mat4 等
 * @param binding WGSL 绑定位置（可选）
 * @param group WGSL 绑定组（可选）
 * @returns Uniform 定义对象
 */
export function uniform(name: string, type: string, binding?: number, group?: number): UniformDef
{
    const def: UniformDef = {
        __type__: UNIFORM_SYMBOL,
        name,
        type,
        binding,
        group,
    };

    // 重写 toString 方法，使其返回变量名，这样在字符串上下文中可以直接使用
    Object.defineProperty(def, 'toString', {
        value: () => name,
        writable: false,
        enumerable: false,
        configurable: false,
    });

    // 重写 valueOf 方法，使其在转换为原始值时返回变量名
    Object.defineProperty(def, 'valueOf', {
        value: () => name,
        writable: false,
        enumerable: false,
        configurable: false,
    });

    return def;
}

/**
 * 定义 attribute 变量
 * @param name 变量名
 * @param type 类型：vec2, vec3, vec4, float 等
 * @param location WGSL location（可选）
 * @returns Attribute 定义对象
 */
export function attribute(name: string, type: string, location?: number): AttributeDef
{
    const def: AttributeDef = {
        __type__: ATTRIBUTE_SYMBOL,
        name,
        type,
        location,
    };

    // 重写 toString 方法，使其返回变量名
    Object.defineProperty(def, 'toString', {
        value: () => name,
        writable: false,
        enumerable: false,
        configurable: false,
    });

    // 重写 valueOf 方法，使其在转换为原始值时返回变量名
    Object.defineProperty(def, 'valueOf', {
        value: () => name,
        writable: false,
        enumerable: false,
        configurable: false,
    });

    return def;
}

/**
 * 检查对象是否为 Uniform 定义
 */
export function isUniformDef(obj: any): obj is UniformDef
{
    return obj && typeof obj === 'object' && obj.__type__ === UNIFORM_SYMBOL;
}

/**
 * 检查对象是否为 Attribute 定义
 */
export function isAttributeDef(obj: any): obj is AttributeDef
{
    return obj && typeof obj === 'object' && obj.__type__ === ATTRIBUTE_SYMBOL;
}

/**
 * 从 Uniform 定义转换为 UniformConfig
 */
export function uniformDefToConfig(def: UniformDef): UniformConfig
{
    return {
        name: def.name,
        type: def.type,
        binding: def.binding,
        group: def.group,
    };
}

/**
 * 从 Attribute 定义转换为 AttributeConfig
 */
export function attributeDefToConfig(def: AttributeDef): AttributeConfig
{
    return {
        name: def.name,
        type: def.type,
        location: def.location,
    };
}

/**
 * 函数定义对象接口
 */
export interface FuncDef
{
    __type__: typeof FUNC_SYMBOL;
    name: string;
    body: () => any;
    shaderType?: 'vertex' | 'fragment';
}

/**
 * 定义函数
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
 * 定义 Fragment Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns 函数定义对象
 */
export function fragment(name: string, body: () => any): FuncDef
{
    return {
        __type__: FUNC_SYMBOL,
        name,
        body,
        shaderType: 'fragment',
    };
}

/**
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns 函数定义对象
 */
export function vertex(name: string, body: () => any): FuncDef
{
    return {
        __type__: FUNC_SYMBOL,
        name,
        body,
        shaderType: 'vertex',
    };
}

