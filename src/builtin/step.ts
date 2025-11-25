import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * step 函数，如果 edge < x 返回 1.0，否则返回 0.0
 */
export function step(edge: Float | Vec3 | Vec4 | number, x: Float | Vec3 | Vec4 | number): Float | Vec3 | Vec4
{
    if (edge instanceof Vec3 || x instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL(type)})`;
        result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

        return result;
    }
    if (edge instanceof Vec4 || x instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL(type)})`;
        result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

        return result;
    }
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toGLSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `step(${typeof edge === 'number' ? formatNumber(edge) : edge.toWGSL(type)}, ${typeof x === 'number' ? formatNumber(x) : x.toWGSL(type)})`;
    result.dependencies = typeof edge === 'number' ? (typeof x === 'number' ? [] : [x]) : (typeof x === 'number' ? [edge] : [edge, x]);

    return result;
}

