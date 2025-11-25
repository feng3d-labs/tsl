import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { formatNumber } from './formatNumber';

/**
 * max 函数，返回两个值中的较大者
 * @param a 第一个值
 * @param b 第二个值
 * @returns 较大的值
 */
export function max<T extends Float>(a: T | number, b: T | number): T
{
    const result = new Float();

    result.toGLSL = (type: 'vertex' | 'fragment') => `max(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `max(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);

    return result as T;
}

