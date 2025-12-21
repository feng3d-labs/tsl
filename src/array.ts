import { ShaderValue } from './IElement';
import { Int } from './builtin/types/int';
import { UInt } from './builtin/types/uint';

/**
 * 数组类型定义，支持通过 index() 方法访问元素
 */
export class Array<T extends ShaderValue>
{
    readonly elementType: (...args: any[]) => T;
    readonly length: number;
    readonly glslType: string;
    readonly wgslType: string;

    // 用于动态索引的访问路径
    private _parentGLSL?: string;
    private _parentWGSL?: string;
    private _memberName?: string;

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
     * 设置访问路径（内部使用）
     */
    _setAccessPath(parentGLSL: string, parentWGSL: string, memberName: string): this
    {
        this._parentGLSL = parentGLSL;
        this._parentWGSL = parentWGSL;
        this._memberName = memberName;

        return this;
    }

    /**
     * 索引数组元素
     * @param idx 索引，可以是数字、Int 或 UInt
     */
    index(idx: number | Int | UInt): T
    {
        const result = this.elementType();
        const idxGLSL = typeof idx === 'number' ? `${idx}` : idx.toGLSL();
        const idxWGSL = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

        result.toGLSL = () => `${this._parentGLSL}.${this._memberName}[${idxGLSL}]`;
        result.toWGSL = () => `${this._parentWGSL}.${this._memberName}[${idxWGSL}]`;
        result.dependencies = typeof idx === 'number' ? [] : [idx];

        return result;
    }
}

/**
 * 创建数组类型
 * @param elementType 元素类型（如 mat4, vec4 等）
 * @param length 数组长度
 * @returns 数组类型定义
 */
export function array<T extends ShaderValue>(elementType: (...args: any[]) => T, length: number): Array<T>
{
    return new Array<T>(elementType, length);
}
