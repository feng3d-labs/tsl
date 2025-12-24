import { IElement, ShaderValue } from '../core/IElement';
import { Int } from '../types/scalar/int';
import { UInt } from '../types/scalar/uint';
import { Varying } from './varying';

/**
 * 数组类型定义，支持通过 index() 方法访问元素
 */
export class Array<T extends ShaderValue> implements ShaderValue
{
    readonly elementType: (...args: any[]) => T;
    readonly length: number;
    readonly glslType: string;
    readonly wgslType: string;

    // ShaderValue 接口实现
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[] = [];

    // 用于动态索引的访问路径
    private _varName?: string;

    // varying 数组相关属性
    private _varying?: Varying;
    private _isVaryingArray?: boolean;

    constructor(elementType: (...args: any[]) => T, length: number)
    {
        this.elementType = elementType;
        this.length = length;

        // 从样本元素获取类型信息
        const sample = this.elementType();
        this.glslType = sample.glslType;
        this.wgslType = sample.wgslType;
    }

    /**
     * 设置为 varying 数组
     * @param varying varying 实例
     */
    _setVarying(varying: Varying): this
    {
        this._varying = varying;
        this._isVaryingArray = true;
        this._varName = varying.name;
        this.toGLSL = () => varying.name;
        this.toWGSL = () => `v.${varying.name}`;
        // 将 varying 添加到依赖中
        this.dependencies = [varying];

        return this;
    }

    /**
     * 获取关联的 varying
     */
    get varying(): Varying | undefined
    {
        return this._varying;
    }

    /**
     * 是否是 varying 数组
     */
    get isVaryingArray(): boolean
    {
        return this._isVaryingArray ?? false;
    }

    /**
     * 设置访问路径（用于 struct 成员）
     */
    _setAccessPath(parentGLSL: string, parentWGSL: string, memberName: string): this
    {
        this.toGLSL = () => `${parentGLSL}.${memberName}`;
        this.toWGSL = () => `${parentWGSL}.${memberName}`;

        return this;
    }

    /**
     * 设置变量名（用于 var_ 声明）
     */
    _setVarName(name: string): this
    {
        this._varName = name;
        this.toGLSL = () => name;
        this.toWGSL = () => name;

        return this;
    }

    /**
     * 索引数组元素
     * @param idx 索引，可以是数字、Int 或 UInt
     */
    index(idx: number | Int | UInt): T
    {
        const result = this.elementType();

        // 动态计算索引字符串，确保在 toGLSL/toWGSL 调用时获取最新值
        result.toGLSL = () =>
        {
            const idxGLSL = typeof idx === 'number' ? `${idx}` : idx.toGLSL();

            return `${this.toGLSL()}[${idxGLSL}]`;
        };

        // WGSL 需要特殊处理 varying 数组（展开为独立变量）
        if (this._isVaryingArray && typeof idx === 'number')
        {
            result.toWGSL = () => `v.${this._varName}_${idx}`;
        }
        else
        {
            result.toWGSL = () =>
            {
                const idxWGSL = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

                return `${this.toWGSL()}[${idxWGSL}]`;
            };
        }
        // 将数组自身和索引添加到依赖中，以便依赖分析能够找到结构体定义
        result.dependencies = typeof idx === 'number' ? [this] : [this, idx];

        return result;
    }
}

/**
 * 创建数组类型工厂函数（用于 UBO 数组成员）
 * @param elementType 元素类型工厂函数（如 mat4, vec4 等）
 * @param length 数组长度
 * @returns 数组类型工厂函数
 */
export function array<T extends ShaderValue>(elementType: (...args: any[]) => T, length: number): () => Array<T>;

/**
 * 创建 varying 数组实例（用于 varying 数组声明）
 * @param template 模板元素（包含 varying 信息）
 * @param length 数组长度
 * @returns 数组实例
 */
export function array<T extends ShaderValue>(template: T, length: number): Array<T>;

export function array<T extends ShaderValue>(arg1: ((...args: any[]) => T) | T, length: number): (() => Array<T>) | Array<T>
{
    // 检查第一个参数是否是函数（工厂函数）
    if (typeof arg1 === 'function')
    {
        // 原有行为：返回工厂函数
        return () => new Array<T>(arg1, length);
    }
    else
    {
        // 新行为：第一个参数是 ShaderValue 实例
        const template = arg1 as T;

        // 检查模板的 dependencies 是否包含 Varying
        let varying: Varying | undefined;
        if (template.dependencies)
        {
            for (const dep of template.dependencies)
            {
                if (dep instanceof Varying)
                {
                    varying = dep;
                    break;
                }
            }
        }

        // 创建一个工厂函数，使用模板的构造函数
        const elementType = () =>
        {
            const cls = template.constructor as new () => T;

            return new cls();
        };

        const arr = new Array<T>(elementType, length);

        // 如果找到了 varying，设置为 varying 数组
        if (varying)
        {
            arr._setVarying(varying);
        }

        return arr;
    }
}
