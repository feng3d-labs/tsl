import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * clamp 函数，将值限制在范围内
 */
export function clamp<T extends Float | Vec3 | Vec4>(a: T | number, min: T | number, max: T | number): T
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `clamp(${a.toGLSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `clamp(${a.toWGSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL(type)})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `clamp(${a.toGLSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `clamp(${a.toWGSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL(type)})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result as T;
    }
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toGLSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toWGSL(type)}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL(type)}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? (typeof min === 'number' ? (typeof max === 'number' ? [] : [max]) : (typeof max === 'number' ? [min] : [min, max])) : (typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]));

    return result as T;
}

