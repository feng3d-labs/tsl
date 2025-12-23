import { Float } from './types/float';
import { Vec3 } from './types/vec3';

/**
 * dFdx 函数，计算屏幕空间 x 方向的导数
 * GLSL: dFdx(p)
 * WGSL: dpdx(p)
 * @param p 输入值
 * @returns 屏幕空间 x 方向的导数
 */
export function dFdx(p: Float): Float;
export function dFdx(p: Vec3): Vec3;
export function dFdx(p: Float | Vec3): Float | Vec3
{
    if (p instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `dFdx(${p.toGLSL()})`;
        result.toWGSL = () => `dpdx(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
    else
    {
        const result = new Float();
        result.toGLSL = () => `dFdx(${p.toGLSL()})`;
        result.toWGSL = () => `dpdx(${p.toWGSL()})`;
        result.dependencies = [p];

        return result;
    }
}

