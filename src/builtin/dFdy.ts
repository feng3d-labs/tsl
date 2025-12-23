import { Float } from './types/float';
import { Vec3 } from './types/vec3';

/**
 * dFdy 函数，计算屏幕空间 y 方向的导数
 * GLSL: dFdy(p)
 * WGSL: dpdy(p)
 * @param p 输入值
 * @returns 屏幕空间 y 方向的导数
 */
export function dFdy(p: Float): Float;
export function dFdy(p: Vec3): Vec3;
export function dFdy(p: Float | Vec3): Float | Vec3
{
    if (p instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `dFdy(${p.toGLSL()})`;
        result.toWGSL = () => `dpdy(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else
    {
        const result = new Float();
        result.toGLSL = () => `dFdy(${p.toGLSL()})`;
        result.toWGSL = () => `dpdy(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
}

