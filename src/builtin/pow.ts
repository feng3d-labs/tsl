import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * pow 函数，计算幂
 */
export function pow(a: Float | Vec3 | Vec4 | number, b: Float | number): Float | Vec3 | Vec4
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `pow(${a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `pow(${a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)})`;
        result.dependencies = typeof b === 'number' ? [a] : [a, b];
        return result;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `pow(${a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `pow(${a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)})`;
        result.dependencies = typeof b === 'number' ? [a] : [a, b];
        return result;
    }
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `pow(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `pow(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? [] : [b]) : (typeof b === 'number' ? [a] : [a, b]);
    return result;
}

