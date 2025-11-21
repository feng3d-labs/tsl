import { formatNumber } from './formatNumber';

export class Float
{
    constructor(private _value: number)
    {
    }

    toGLSL(): string
    {
        return formatNumber(this._value);
    }

    toWGSL(): string
    {
        return formatNumber(this._value);
    }
}

export function float(value: number)
{
    return new Float(value);
}