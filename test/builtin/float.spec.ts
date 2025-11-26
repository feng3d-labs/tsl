import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/Attribute';
import { float, Float } from '../../src/builtin/types/float';
import { Uniform } from '../../src/Uniform';
import { Varying } from '../../src/Varying';

describe('Float', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Float 实例', () =>
        {
            const f = float(1.0);
            expect(f).toBeInstanceOf(Float);
        });

        it('应该正确存储值', () =>
        {
            const f = float(1.5);
            expect(f.toGLSL('vertex')).toBe('1.5');
            expect(f.toWGSL('vertex')).toBe('1.5');
        });
    });

    describe('float(uniform: Uniform)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const uniform = new Uniform('uValue', 0, 0);
            const result = float(uniform);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL('vertex')).toBe('uValue');
            expect(result.toWGSL('vertex')).toBe('uValue');
        });
    });

    describe('float(attribute: Attribute)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const attribute = new Attribute('aValue', 0);
            const result = float(attribute);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL('vertex')).toBe('aValue');
            expect(result.toWGSL('vertex')).toBe('aValue');
        });
    });

    describe('float(varying: Varying)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const varying = new Varying('vValue', 0);
            const result = float(varying);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL('vertex')).toBe('vValue');
            expect(result.toWGSL('vertex')).toBe('vValue');
        });
    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.add(b);
            expect(result.toGLSL('vertex')).toBe('1.0 + 2.0');
            expect(result.toWGSL('vertex')).toBe('1.0 + 2.0');
        });

        it('应该支持减法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.subtract(b);
            expect(result.toGLSL('vertex')).toBe('1.0 - 2.0');
            expect(result.toWGSL('vertex')).toBe('1.0 - 2.0');
        });

        it('应该支持乘法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL('vertex')).toBe('1.0 * 2.0');
            expect(result.toWGSL('vertex')).toBe('1.0 * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL('vertex')).toBe('1.0 / 2.0');
            expect(result.toWGSL('vertex')).toBe('1.0 / 2.0');
        });

        it('应该支持数字字面量运算', () =>
        {
            const a = float(1.0);
            const result = a.multiply(2.0);
            expect(result.toGLSL('vertex')).toBe('1.0 * 2.0');
            expect(result.toWGSL('vertex')).toBe('1.0 * 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL('vertex')).toBe('(1.0 + 2.0) * 3.0');
            expect(mul.toWGSL('vertex')).toBe('(1.0 + 2.0) * 3.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL('vertex')).toBe('1.0 + 2.0 * 3.0');
            expect(add2.toWGSL('vertex')).toBe('1.0 + 2.0 * 3.0');

            // a / (b + c) 应该生成括号
            const add3 = b.add(c);
            const div = a.divide(add3);
            expect(div.toGLSL('vertex')).toBe('1.0 / (2.0 + 3.0)');
            expect(div.toWGSL('vertex')).toBe('1.0 / (2.0 + 3.0)');
        });

        it('应该优化 -1.0 * x 为 -x', () =>
        {
            const negOne = float(-1.0);
            const x = float(2.0);

            // -1.0 * x 应该优化为 -x
            const result = negOne.multiply(x);
            expect(result.toGLSL('vertex')).toBe('-2.0');
            expect(result.toWGSL('vertex')).toBe('-2.0');

            // -1.0 * (a + b) 应该优化为 -(a + b)
            const a = float(1.0);
            const b = float(2.0);
            const add = a.add(b);
            const result2 = negOne.multiply(add);
            expect(result2.toGLSL('vertex')).toBe('-(1.0 + 2.0)');
            expect(result2.toWGSL('vertex')).toBe('-(1.0 + 2.0)');
        });

        it('应该正确处理科学计数法并优化同级乘法', () =>
        {
            const a = float(0.2);
            const turbidity = float(new Uniform('turbidity', 0, 0));
            const b = float(10E-18);
            // 0.2 * turbidity * 1e-17 应该生成 0.2 * turbidity * 1e-17（同级乘法不需要括号）
            const mul1 = a.multiply(turbidity);
            const mul2 = mul1.multiply(b);
            expect(mul2.toGLSL('vertex')).toBe('0.2 * turbidity * 1e-17');
            expect(mul2.toWGSL('vertex')).toBe('0.2 * turbidity * 1e-17');
        });
    });
});

