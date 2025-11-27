import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { formatNumber } from './formatNumber';

/**
 * acos 函数，计算反余弦
 */
export function acos(a: Float | number): Float
{
    const result = new Float();
    result.toGLSL = () => `acos(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()})`;
    result.toWGSL = () => `acos(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}

