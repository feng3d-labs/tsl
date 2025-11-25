import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';

/**
 * exp 函数，计算 e 的幂
 */
export function exp<T extends Float | Vec3 | Vec4>(a: T | number): T
{
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `exp(${a.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `exp(${a.toWGSL(type)})`;
        result.dependencies = [a];

        return result as T;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `exp(${a.toGLSL(type)})`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `exp(${a.toWGSL(type)})`;
        result.dependencies = [a];

        return result as T;
    }
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `exp(${typeof a === 'number' ? a : a.toGLSL(type)})`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `exp(${typeof a === 'number' ? a : a.toWGSL(type)})`;
    result.dependencies = typeof a === 'number' ? [] : [a];

    return result as T;
}

