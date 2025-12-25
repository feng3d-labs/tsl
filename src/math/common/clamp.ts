import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec3 } from '../../types/vector/vec3';
import { Vec4 } from '../../types/vector/vec4';

/**
 * clamp 函数，将值限制在范围内
 */
export function clamp(a: Vec2, min: Vec2, max: Vec2): Vec2;
export function clamp(a: Vec2, min: number, max: number): Vec2;
export function clamp(a: Vec3, min: Vec3, max: Vec3): Vec3;
export function clamp(a: Vec3, min: number, max: number): Vec3;
export function clamp(a: Vec4, min: Vec4, max: Vec4): Vec4;
export function clamp(a: Vec4, min: number, max: number): Vec4;
export function clamp(a: Float | number, min: Float | number, max: Float | number): Float;
export function clamp(a: Float | Vec2 | Vec3 | Vec4 | number, min: Float | Vec2 | Vec3 | Vec4 | number, max: Float | Vec2 | Vec3 | Vec4 | number): Float | Vec2 | Vec3 | Vec4
{
    if (a instanceof Vec2)
    {
        const result = new Vec2();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
        // WGSL 不支持 clamp(vec2, float, float)，需要转换为 clamp(vec2, vec2(float), vec2(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${typeof min === 'number' ? `vec2<f32>(${formatNumber(min)})` : min.toWGSL()}, ${typeof max === 'number' ? `vec2<f32>(${formatNumber(max)})` : max.toWGSL()})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result;
    }
    if (a instanceof Vec3)
    {
        const result = new Vec3();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
        // WGSL 不支持 clamp(vec3, float, float)，需要转换为 clamp(vec3, vec3(float), vec3(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${typeof min === 'number' ? `vec3<f32>(${formatNumber(min)})` : min.toWGSL()}, ${typeof max === 'number' ? `vec3<f32>(${formatNumber(max)})` : max.toWGSL()})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result;
    }
    if (a instanceof Vec4)
    {
        const result = new Vec4();
        result.toGLSL = () => `clamp(${a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
        // WGSL 不支持 clamp(vec4, float, float)，需要转换为 clamp(vec4, vec4(float), vec4(float))
        result.toWGSL = () => `clamp(${a.toWGSL()}, ${typeof min === 'number' ? `vec4<f32>(${formatNumber(min)})` : min.toWGSL()}, ${typeof max === 'number' ? `vec4<f32>(${formatNumber(max)})` : max.toWGSL()})`;
        result.dependencies = typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]);

        return result;
    }
    const result = new Float();
    result.toGLSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toGLSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toGLSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toGLSL()})`;
    result.toWGSL = () => `clamp(${typeof a === 'number' ? formatNumber(a) : a.toWGSL()}, ${typeof min === 'number' ? formatNumber(min) : min.toWGSL()}, ${typeof max === 'number' ? formatNumber(max) : max.toWGSL()})`;
    result.dependencies = typeof a === 'number' ? (typeof min === 'number' ? (typeof max === 'number' ? [] : [max]) : (typeof max === 'number' ? [min] : [min, max])) : (typeof min === 'number' ? (typeof max === 'number' ? [a] : [a, max]) : (typeof max === 'number' ? [a, min] : [a, min, max]));

    return result;
}

