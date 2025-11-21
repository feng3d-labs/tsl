import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/Attribute';
import { Expression } from '../../src/builtin/Expression';
import { Float } from '../../src/builtin/float';
import { vec2, Vec2 } from '../../src/builtin/vec2';
import { Uniform } from '../../src/Uniform';

describe('Vec2', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Vec2 实例', () =>
        {
            const v = vec2(1.0, 2.0);
            expect(v).toBeInstanceOf(Vec2);
        });

        it('应该正确存储 x 和 y 值', () =>
        {
            const v = vec2(1.5, 2.5);
            expect(v.x).toBeInstanceOf(Float);
            expect(v.y).toBeInstanceOf(Float);
        });
    });

    describe('getter', () =>
    {
        it('应该能够获取 x 分量', () =>
        {
            const v = new Vec2(10.0, 20.0);
            expect(v.x).toBeInstanceOf(Float);
            expect(v.x.toGLSL()).toBe('10.0');
        });

        it('应该能够获取 y 分量', () =>
        {
            const v = new Vec2(10.0, 20.0);
            expect(v.y).toBeInstanceOf(Float);
            expect(v.y.toGLSL()).toBe('20.0');
        });
    });

    describe('toGLSL', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = new Vec2(1.0, 2.0);
            expect(v.toGLSL()).toBe('vec2(1.0, 2.0)');
        });

        it('应该处理浮点数', () =>
        {
            const v = new Vec2(1.5, 2.5);
            expect(v.toGLSL()).toBe('vec2(1.5, 2.5)');
        });

        it('应该处理负数', () =>
        {
            const v = new Vec2(-1.0, -2.0);
            expect(v.toGLSL()).toBe('vec2(-1.0, -2.0)');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = new Vec2(1.0, 2.0);
            expect(v.toWGSL()).toBe('vec2<f32>(1.0, 2.0)');
        });

        it('应该处理浮点数', () =>
        {
            const v = new Vec2(1.5, 2.5);
            expect(v.toWGSL()).toBe('vec2<f32>(1.5, 2.5)');
        });

        it('应该处理负数', () =>
        {
            const v = new Vec2(-1.0, -2.0);
            expect(v.toWGSL()).toBe('vec2<f32>(-1.0, -2.0)');
        });
    });
});

describe('vec2', () =>
{
    describe('vec2(x: number, y: number)', () =>
    {
        it('应该返回 Vec2 实例', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result).toBeInstanceOf(Vec2);
        });

        it('应该正确创建 Vec2 实例', () =>
        {
            const result = vec2(1.5, 2.5);
            expect(result.x).toBeInstanceOf(Float);
            expect(result.y).toBeInstanceOf(Float);
            expect(result.x.toGLSL()).toBe('1.5');
            expect(result.y.toGLSL()).toBe('2.5');
        });

        it('应该能够转换为 GLSL', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0)');
        });

        it('应该能够转换为 WGSL', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0)');
        });
    });

    describe('vec2(uniform: Uniform)', () =>
    {
        it('应该返回 Expression 实例', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec2(uniform);
            expect(result).toBeInstanceOf(Expression);
        });

        it('应该将 FunctionCallConfig 保存到 uniform.value', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            vec2(uniform);
            expect(uniform.value).toBeDefined();
            expect(uniform.value?.function).toBe('vec2');
            expect(uniform.value?.args).toEqual(['uPosition']);
        });

        it('应该正确设置 Expression 的 config', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec2(uniform);
            expect(result.config.function).toBe('vec2');
            expect(result.config.args).toEqual(['uPosition']);
        });
    });

    describe('vec2(attribute: Attribute)', () =>
    {
        it('应该返回 Expression 实例', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec2(attribute);
            expect(result).toBeInstanceOf(Expression);
        });

        it('应该将 FunctionCallConfig 保存到 attribute.value', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            vec2(attribute);
            expect(attribute.value).toBeDefined();
            expect(attribute.value?.function).toBe('vec2');
            expect(attribute.value?.args).toEqual(['aPosition']);
        });

        it('应该正确设置 Expression 的 config', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec2(attribute);
            expect(result.config.function).toBe('vec2');
            expect(result.config.args).toEqual(['aPosition']);
        });
    });

    describe('其他参数组合', () =>
    {
        it('应该处理多个数字参数', () =>
        {
            // 注意：当前实现中，只有两个数字参数会返回 Vec2
            // 多个参数会返回 Expression
            const result = (vec2 as any)(1.0, 2.0, 3.0);
            expect(result).toBeInstanceOf(Expression);
        });

        it('应该处理字符串参数', () =>
        {
            const result = (vec2 as any)('x', 'y');
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec2');
            expect(result.config.args).toEqual(['x', 'y']);
        });

        it('应该处理混合参数', () =>
        {
            const result = (vec2 as any)(1.0, 'y');
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec2');
            expect(result.config.args).toEqual([1.0, 'y']);
        });
    });
});

