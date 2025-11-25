import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec2 } from './types/vec2';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { formatNumber } from './formatNumber';

/**
 * 加法函数
 */
export function add<T extends Float | Vec2 | Vec3 | Vec4>(a: T, b: T): T
{
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} + ${b.toGLSL(type)}`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} + ${b.toWGSL(type)}`;
        result.dependencies = [a, b];

        return result as T;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} + ${b.toGLSL(type)}`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} + ${b.toWGSL(type)}`;
        result.dependencies = [a, b];

        return result as T;
    }
    if (a instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} + ${b.toGLSL(type)}`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} + ${b.toWGSL(type)}`;
        result.dependencies = [a, b];

        return result as T;
    }
    // Float
    const result = new Float();
    result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} + ${b.toGLSL(type)}`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} + ${b.toWGSL(type)}`;
    result.dependencies = [a, b];

    return result as T;
}

