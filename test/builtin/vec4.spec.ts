import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/Attribute';
import { vec2 } from '../../src/builtin/vec2';
import { vec4, Vec4 } from '../../src/builtin/vec4';
import { Uniform } from '../../src/Uniform';

describe('vec4', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Vec4 实例', () =>
        {
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            expect(v).toBeInstanceOf(Vec4);
            expect(v.toGLSL('vertex')).toBe('vec4(1.0, 2.0, 3.0, 4.0)');
            expect(v.toWGSL('vertex')).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0)');
        });
    });

    describe('vec4(xy: Vec2, z: number, w: number)', () =>
    {
        it('应该从 Vec2 字面量和两个数字创建 Vec4', () =>
        {
            const xy = vec2(1.0, 2.0);
            const result = vec4(xy, 3.0, 4.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL('vertex')).toBe('vec4(vec2(1.0, 2.0), 3.0, 4.0)');
            expect(result.toWGSL('vertex')).toBe('vec4<f32>(vec2<f32>(1.0, 2.0), 3.0, 4.0)');
        });

        it('应该从 Vec2 uniform 和两个数字创建 Vec4', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const xy = vec2(uniform);
            const result = vec4(xy, 0.0, 1.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL('vertex')).toBe('vec4(uPosition, 0.0, 1.0)');
            expect(result.toWGSL('vertex')).toBe('vec4<f32>(uPosition, 0.0, 1.0)');
        });

        it('应该从 Vec2 attribute 和两个数字创建 Vec4', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const xy = vec2(attribute);
            const result = vec4(xy, 0.0, 1.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL('vertex')).toBe('vec4(aPosition, 0.0, 1.0)');
            expect(result.toWGSL('vertex')).toBe('vec4<f32>(aPosition, 0.0, 1.0)');
        });
    });
});

