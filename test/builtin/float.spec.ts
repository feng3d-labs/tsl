import { describe, expect, it } from 'vitest';
import { float, Float } from '../../src/builtin/float';

describe('Float', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Float 实例', () =>
        {
            const f = new Float(1.0);
            expect(f).toBeInstanceOf(Float);
        });

        it('应该正确存储值', () =>
        {
            const f = new Float(1.5);
            expect(f['_value']).toBe(1.5);
        });
    });

    describe('toGLSL', () =>
    {
        it('应该生成正确的 GLSL 代码（整数）', () =>
        {
            const f = new Float(1.0);
            expect(f.toGLSL()).toBe('1.0');
        });

        it('应该生成正确的 GLSL 代码（浮点数）', () =>
        {
            const f = new Float(1.5);
            expect(f.toGLSL()).toBe('1.5');
        });

        it('应该处理负数', () =>
        {
            const f = new Float(-1.0);
            expect(f.toGLSL()).toBe('-1.0');
        });

        it('应该处理零', () =>
        {
            const f = new Float(0.0);
            expect(f.toGLSL()).toBe('0.0');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该生成正确的 WGSL 代码（整数）', () =>
        {
            const f = new Float(1.0);
            expect(f.toWGSL()).toBe('1.0');
        });

        it('应该生成正确的 WGSL 代码（浮点数）', () =>
        {
            const f = new Float(1.5);
            expect(f.toWGSL()).toBe('1.5');
        });

        it('应该处理负数', () =>
        {
            const f = new Float(-1.0);
            expect(f.toWGSL()).toBe('-1.0');
        });

        it('应该处理零', () =>
        {
            const f = new Float(0.0);
            expect(f.toWGSL()).toBe('0.0');
        });
    });
});

describe('float', () =>
{
    describe('float(value: number)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const result = float(1.0);
            expect(result).toBeInstanceOf(Float);
        });

        it('应该正确创建 Float 实例', () =>
        {
            const result = float(1.5);
            expect(result['_value']).toBe(1.5);
        });

        it('应该能够转换为 GLSL', () =>
        {
            const result = float(1.0);
            expect(result.toGLSL()).toBe('1.0');
        });

        it('应该能够转换为 WGSL', () =>
        {
            const result = float(1.0);
            expect(result.toWGSL()).toBe('1.0');
        });

        it('应该处理浮点数', () =>
        {
            const result = float(3.14159);
            expect(result.toGLSL()).toBe('3.14159');
            expect(result.toWGSL()).toBe('3.14159');
        });

        it('应该处理负数', () =>
        {
            const result = float(-2.5);
            expect(result.toGLSL()).toBe('-2.5');
            expect(result.toWGSL()).toBe('-2.5');
        });
    });
});

