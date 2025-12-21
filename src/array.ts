import { IElement, ShaderValue } from './IElement';

/**
 * 类型信息接口
 */
interface TypeInfo
{
    glslType: string;
    wgslType: string;
}

/**
 * 类型构造函数接口
 */
interface TypeConstructor<T extends ShaderValue> extends TypeInfo
{
    new(): T;
}

/**
 * 数组类型定义
 */
export class Array<T extends ShaderValue>
{
    readonly elementType: TypeConstructor<T>;
    readonly length: number;
    readonly glslType: string;
    readonly wgslType: string;

    // 用于访问数组的父级路径
    private _parentGLSL?: string;
    private _parentWGSL?: string;
    private _memberName?: string;

    constructor(elementType: TypeConstructor<T> | TypeInfo, length: number)
    {
        this.elementType = elementType as TypeConstructor<T>;
        this.length = length;
        this.glslType = elementType.glslType;
        this.wgslType = elementType.wgslType;
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
     */
    index(idx: number | ShaderValue): T
    {
        if (this._parentGLSL === undefined || this._parentWGSL === undefined || this._memberName === undefined)
        {
            throw new Error('Array access path not set. This array must be used as a struct member.');
        }

        const result = new this.elementType();
        const idxGLSL = typeof idx === 'number' ? `${idx}` : idx.toGLSL();
        const idxWGSL = typeof idx === 'number' ? `${idx}` : idx.toWGSL();

        result.toGLSL = () => `${this._parentGLSL}.${this._memberName}[${idxGLSL}]`;
        result.toWGSL = () => `${this._parentWGSL}.${this._memberName}[${idxWGSL}]`;
        result.dependencies = typeof idx === 'number' ? [] : [idx as IElement];

        return result;
    }
}

/**
 * 创建数组类型
 * @param elementType 元素类型（如 mat4, vec4 等）
 * @param length 数组长度
 * @returns 数组类型定义
 */
export function array<T extends ShaderValue>(elementType: TypeConstructor<T> | TypeInfo, length: number): Array<T>
{
    return new Array<T>(elementType, length);
}
