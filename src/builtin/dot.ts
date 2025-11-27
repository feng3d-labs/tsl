import { IElement, ShaderValue } from '../IElement';
import { Float } from './types/float';
import { Vec3 } from './types/vec3';

/**
 * dot 函数，计算两个向量的点积
 * @param a 第一个向量
 * @param b 第二个向量
 * @returns 点积结果
 */
export function dot(a: Vec3, b: Vec3): Float
{
    const result = new Float();
    result.toGLSL = () => `dot(${a.toGLSL()}, ${b.toGLSL()})`;
    result.toWGSL = () => `dot(${a.toWGSL()}, ${b.toWGSL()})`;
    result.dependencies = [a, b];

    return result;
}

