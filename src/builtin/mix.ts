import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * mix 函数，线性插值
 */
export function mix(a: Float | Vec3 | Vec4 | number, b: Float | Vec3 | Vec4 | number, t: Float | number): Float | Vec3 | Vec4
{
    if (a instanceof Vec3 || b instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL(type)})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));
        return result;
    }
    if (a instanceof Vec4 || b instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL(type)})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));
        return result;
    }
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL(type)}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));
    return result;
}

