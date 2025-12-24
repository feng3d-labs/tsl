import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';

/**
 * clamp 函数，将值限制在范围内
 */
export function clamp<T extends Float | Vec3 | Vec4>(a: T | number, min: T | number, max: T | number): T
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result as T;
    }
    const result = new Float();
    result.toGLSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
    result.toWGSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof min === 'number' ? (typeof max === 'number' ? [] : [max]) : (typeof max === 'number' ? [min] : [min, max])) : (typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]));

    return result as T;
}

