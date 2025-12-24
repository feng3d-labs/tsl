import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../../types/scalar/float';
import { formatNumber } from '../../core/formatNumber';

/**
 * smoothstep 函数，在边缘之间进行平滑插值
 */
export function smoothstep(edge0: Float | number, edge1: Float | number, x: Float | number): Float
{
    const result = new Float();
    result.toGLSL = () => `smoothstep(${typeof edge0 === 'number' ? formatNumber(edge0) : edge0.toGLSL()}, ${typeof edge1 === 'number' ? formatNumber(edge1) : edge1.toGLSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL()})`;
    result.toWGSL = () => `smoothstep(${typeof edge0 === 'number' ? formatNumber(edge0) : edge0.toWGSL()}, ${typeof edge1 === 'number' ? formatNumber(edge1) : edge1.toWGSL()}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL()})`;
    result.dependencies = typeof edge0 === 'number' ? (typeof edge1 === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge1] : [edge1, x])) : (typeof edge1 === 'number' ? (typeof x === 'number' ? [edge0] : [edge0, x]) : (typeof x === 'number' ? [edge0, edge1] : [edge0, edge1, x]));

    return result;
}

