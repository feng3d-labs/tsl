import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec2 } from './types/vec2';
import { Vec3 } from './types/vec3';
import { Vec4 } from './types/vec4';
import { Mat4 } from './types/mat4';
import { formatNumber } from './formatNumber';

/**
 * 乘法函数
 */
export function multiply(a: Mat4, b: Vec4): Vec4;
export function multiply<T extends Float | Vec2 | Vec3 | Vec4>(a: T, b: T | number): T;
export function multiply<T extends Float | Vec2 | Vec3 | Vec4 | Mat4>(a: T, b: T extends Mat4 ? Vec4 : (T | number)): T extends Mat4 ? Vec4 : T
{
    if (a instanceof Mat4)
    {
        return (a as any).multiply(b as any) as any;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        const other = b as Vec4 | Float | number;
        if (other instanceof Vec4)
        {
            // 检查 a 是否是复合表达式（包含运算符），如果是则加括号
            const aExpr = a.toGLSL('vertex');
            const needsParens = aExpr.includes('+') || aExpr.includes('-') || aExpr.includes('*') || aExpr.includes('/');

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const aStr = needsParens ? `(${a.toGLSL(type)})` : a.toGLSL(type);

                return `${aStr} * ${other.toGLSL(type)}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const aStr = needsParens ? `(${a.toWGSL(type)})` : a.toWGSL(type);

                return `${aStr} * ${other.toWGSL(type)}`;
            };
            result.dependencies = [a, other];
        }
        else
        {
            // 检查 a 是否是复合表达式（包含运算符），如果是则加括号
            const aExpr = a.toGLSL('vertex');
            const needsParens = aExpr.includes('+') || aExpr.includes('-') || aExpr.includes('*') || aExpr.includes('/');

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const aStr = needsParens ? `(${a.toGLSL(type)})` : a.toGLSL(type);

                return `${aStr} * ${typeof other === 'number' ? other : other.toGLSL(type)}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const aStr = needsParens ? `(${a.toWGSL(type)})` : a.toWGSL(type);

                return `${aStr} * ${typeof other === 'number' ? other : other.toWGSL(type)}`;
            };
            result.dependencies = typeof other === 'number' ? [a] : [a, other];
        }

        return result as T;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        const other = b as Vec3 | Float | number;
        if (other instanceof Vec3)
        {
            result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} * ${other.toGLSL(type)}`;
            result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} * ${other.toWGSL(type)}`;
            result.dependencies = [a, other];
        }
        else
        {
            result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} * ${typeof other === 'number' ? other : other.toGLSL(type)}`;
            result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} * ${typeof other === 'number' ? other : other.toWGSL(type)}`;
            result.dependencies = typeof other === 'number' ? [a] : [a, other];
        }

        return result as T;
    }
    if (a instanceof Vec2)
    {
        const result = new Vec2(0, 0);
        const other = b as Vec2 | Float | number;
        if (other instanceof Vec2)
        {
            result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} * ${other.toGLSL(type)}`;
            result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} * ${other.toWGSL(type)}`;
            result.dependencies = [a, other];
        }
        else
        {
            result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} * ${typeof other === 'number' ? other : other.toGLSL(type)}`;
            result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} * ${typeof other === 'number' ? other : other.toWGSL(type)}`;
            result.dependencies = typeof other === 'number' ? [a] : [a, other];
        }

        return result as T;
    }
    // Float
    const result = new Float();
    const other = b as Float | number;
    result.toGLSL = (type: 'vertex' | 'fragment') => `${a.toGLSL(type)} * ${typeof other === 'number' ? formatNumber(other) : other.toGLSL(type)}`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `${a.toWGSL(type)} * ${typeof other === 'number' ? formatNumber(other) : other.toWGSL(type)}`;
    result.dependencies = typeof other === 'number' ? [a] : [a, other];

    return result as T;
}

