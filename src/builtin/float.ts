import { formatNumber } from './formatNumber';

export class Float
{
    private _parentVector?: { toGLSL: () => string; toWGSL: () => string };
    private _component?: string;

    constructor(value: number, parentVector?: { toGLSL: () => string; toWGSL: () => string }, component?: string)
    {
        this._value = value;
        this._parentVector = parentVector;
        this._component = component;
    }

    private _value: number;

    get value(): number
    {
        return this._value;
    }

    toGLSL(): string
    {
        // 如果有父向量和分量名称，生成向量分量访问表达式
        if (this._parentVector && this._component)
        {
            return `${this._parentVector.toGLSL()}.${this._component}`;
        }

        return formatNumber(this._value);
    }

    toWGSL(): string
    {
        // 如果有父向量和分量名称，生成向量分量访问表达式
        if (this._parentVector && this._component)
        {
            return `${this._parentVector.toWGSL()}.${this._component}`;
        }

        return formatNumber(this._value);
    }
}

export function float(value: number)
{
    return new Float(value);
}