import { IElement, ShaderValue } from './IElement';
import { Int } from './builtin/types/int';
import { UInt } from './builtin/types/uint';

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
        result.toWGSL = () =>
        {
            const idxWGSL = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

            return `${this.toWGSL()}[${idxWGSL}]`;
        };
        // 将数组自身和索引添加到依赖中，以便依赖分析能够找到结构体定义
        result.dependencies = typeof idx === 'number' ? [...this.dependencies] : [...this.dependencies, idx];

        return result;
    }
}

/**
 * 创建数组类型工厂函数
 * @param elementType 元素类型（如 mat4, vec4 等）
 * @param length 数组长度
 * @returns 数组类型工厂函数
 */
export function array<T extends ShaderValue>(elementType: (...args: any[]) => T, length: number): () => Array<T>
{
    return () => new Array<T>(elementType, length);
}
