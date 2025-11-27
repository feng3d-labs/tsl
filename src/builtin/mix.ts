import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * mix 函数，线性插值
 */
export function mix<T extends Float | Vec3 | Vec4>(a: T | number, b: T | number, t: Float | number): T
{
    if (a instanceof Vec3 || b instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
        result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));

        return result as T;
    }
    if (a instanceof Vec4 || b instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
        result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
        result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toGLSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toGLSL()})`;
    result.toWGSL = () => `mix(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof b === 'number' ? formatNumber(b) : b.toWGSL()}, ${typeof t === 'number' ? formatNumber(t) : t.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof b === 'number' ? (typeof t === 'number' ? [] : [t]) : (typeof t === 'number' ? [b] : [b, t])) : (typeof b === 'number' ? (typeof t === 'number' ? [a] : [a, t]) : (typeof t === 'number' ? [a, b] : [a, b, t]));

    return result as T;
}

