import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec2 } from './types/vec2';
import { formatNumber } from './formatNumber';

/**
 * atan 函数，计算反正切
 */
export function atan(a: Float | Vec2 | number, b?: Float | number): Float | Vec2
{
    if (a instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        result.toGLSL = (type: 'vertex' | 'fragment') => `atan(${a.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `atan(${a.toWGSL(type)})`;
        result.dependencies = [a];

        return result;
    }
    const result = new Float();
    if (b !== undefined)
    {
        result.toGLSL = (type: 'vertex' | 'fragment') => `atan(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `atan2(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);
    }
    else
    {
        result.toGLSL = (type: 'vertex' | 'fragment') => `atan(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `atan(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)})`;
        result.dependencies = typeof a === 'number' ? [] : [a];
    }

    return result;
}

