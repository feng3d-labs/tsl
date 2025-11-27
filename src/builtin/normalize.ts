import { IElement, ShaderValue } from '../IElement';
import { Vec3 } from './types/vec3';

/**
 * normalize 函数，归一化向量
 * @param v 要归一化的向量
 * @returns 归一化后的向量
 */
export function normalize(v: Vec3): Vec3
{
    const result = new Vec3();
    result.toGLSL = () => `normalize(${v.toGLSL()})`;
    result.toWGSL = () => `normalize(${v.toWGSL()})`;
    result.dependencies = [v];

    return result;
}

