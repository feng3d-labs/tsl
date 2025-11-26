import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { formatNumber } from './formatNumber';

/**
 * smoothstep 函数，在边缘之间进行平滑插值
 */
export function smoothstep(edge0: Float | number, edge1: Float | number, x: Float | number): Float
{
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `smoothstep(${typeof edge0 === 'number' ? formatNumber(edge0) : edge0.toGLSL(type)}, ${typeof edge1 === 'number' ? formatNumber(edge1) : edge1.toGLSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `smoothstep(${typeof edge0 === 'number' ? formatNumber(edge0) : edge0.toWGSL(type)}, ${typeof edge1 === 'number' ? formatNumber(edge1) : edge1.toWGSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL(type)})`;
    result.dependencies = typeof edge0 === 'number' ? (typeof edge1 === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge1] : [edge1, x])) : (typeof edge1 === 'number' ? (typeof x === 'number' ? [edge0] : [edge0, x]) : (typeof x === 'number' ? [edge0, edge1] : [edge0, edge1, x]));

    return result;
}

