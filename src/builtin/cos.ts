import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { formatNumber } from './formatNumber';

/**
 * cos 函数，计算余弦
 */
export function cos(a: Float | number): Float
{
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `cos(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `cos(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result;
}

