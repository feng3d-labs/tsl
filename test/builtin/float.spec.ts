import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/Attribute';
import { float, Float } from '../../src/builtin/types/float';
import { Uniform } from '../../src/Uniform';
import { Varying } from '../../src/Varying';
import { exp } from '../../src/builtin/exp';
import { max } from '../../src/builtin/max';
import { vec3 } from '../../src/builtin/types/vec3';
import { varyingStruct } from '../../src/varyingStruct';
import { varying } from '../../src/Varying';

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
            expect(f.toGLSL()).toBe('1.5');
            expect(f.toWGSL()).toBe('1.5');
        });
    });

    describe('float(uniform: Uniform)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const uniform = new Uniform('uValue', 0, 0);
            const result = float(uniform);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('uValue');
            expect(result.toWGSL()).toBe('uValue');
        });
    });

    describe('float(attribute: Attribute)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const attribute = new Attribute('aValue', 0);
            const result = float(attribute);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('aValue');
            expect(result.toWGSL()).toBe('aValue');
        });
    });

    describe('float(varying: Varying)', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const struct = varyingStruct({
                vValue: float(varying(0)),
            });
            const result = struct.vValue;
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('vValue');
            expect(result.toWGSL()).toBe('v.vValue');
            expect(result.toGLSL()).toBe('vValue');
            expect(result.toWGSL()).toBe('v.vValue');
        });
    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.add(b);
            expect(result.toGLSL()).toBe('1.0 + 2.0');
            expect(result.toWGSL()).toBe('1.0 + 2.0');
        });

        it('应该支持减法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.subtract(b);
            expect(result.toGLSL()).toBe('1.0 - 2.0');
            expect(result.toWGSL()).toBe('1.0 - 2.0');
        });

        it('应该支持乘法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL()).toBe('1.0 * 2.0');
            expect(result.toWGSL()).toBe('1.0 * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL()).toBe('1.0 / 2.0');
            expect(result.toWGSL()).toBe('1.0 / 2.0');
        });

        it('应该支持数字字面量运算', () =>
        {
            const a = float(1.0);
            const result = a.multiply(2.0);
            expect(result.toGLSL()).toBe('1.0 * 2.0');
            expect(result.toWGSL()).toBe('1.0 * 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(1.0 + 2.0) * 3.0');
            expect(mul.toWGSL()).toBe('(1.0 + 2.0) * 3.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL()).toBe('1.0 + 2.0 * 3.0');
            expect(add2.toWGSL()).toBe('1.0 + 2.0 * 3.0');

            // a / (b + c) 应该生成括号
            const add3 = b.add(c);
            const div = a.divide(add3);
            expect(div.toGLSL()).toBe('1.0 / (2.0 + 3.0)');
            expect(div.toWGSL()).toBe('1.0 / (2.0 + 3.0)');
        });

        it('应该优化 -1.0 * x 为 -x', () =>
        {
            const negOne = float(-1.0);
            const x = float(2.0);

            // -1.0 * x 应该优化为 -x
            const result = negOne.multiply(x);
            expect(result.toGLSL()).toBe('-2.0');
            expect(result.toWGSL()).toBe('-2.0');

            // -1.0 * (a + b) 应该优化为 -(a + b)
            const a = float(1.0);
            const b = float(2.0);
            const add = a.add(b);
            const result2 = negOne.multiply(add);
            expect(result2.toGLSL()).toBe('-(1.0 + 2.0)');
            expect(result2.toWGSL()).toBe('-(1.0 + 2.0)');
        });

        it('应该正确处理科学计数法并优化同级乘法', () =>
        {
            const a = float(0.2);
            const turbidity = float(new Uniform('turbidity', 0, 0));
            const b = float(10E-18);
            // 0.2 * turbidity * 1e-17 应该生成 0.2 * turbidity * 1e-17（同级乘法不需要括号）
            const mul1 = a.multiply(turbidity);
            const mul2 = mul1.multiply(b);
            expect(mul2.toGLSL()).toBe('0.2 * turbidity * 1e-17');
            expect(mul2.toWGSL()).toBe('0.2 * turbidity * 1e-17');
        });

        it('应该正确处理 -1.0 * (a - b) / c 优化为 -((a - b) / c)', () =>
        {
            const cutoffAngle = float(new Uniform('cutoffAngle', 0, 0));
            const acosClamped = float(new Uniform('acosClamped', 0, 0));
            const steepness = float(new Uniform('steepness', 0, 0));
            // float(-1.0).multiply(cutoffAngle.subtract(acosClamped).divide(steepness))
            // 应该生成 -((cutoffAngle - acosClamped) / steepness)
            const sub = cutoffAngle.subtract(acosClamped);
            const div = sub.divide(steepness);
            const negMul = float(-1.0).multiply(div);
            expect(negMul.toGLSL()).toBe('-((cutoffAngle - acosClamped) / steepness)');
            expect(negMul.toWGSL()).toBe('-((cutoffAngle - acosClamped) / steepness)');
        });

        it('应该正确处理完整的复杂表达式', () =>
        {
            // 模拟 assign(vSunE, EE.multiply(max(0.0, float(1.0).subtract(exp(float(-1.0).multiply(cutoffAngle.subtract(acosClamped).divide(steepness)))))));
            // 应该生成: EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))
            const EE = float(new Uniform('EE', 0, 0));
            const cutoffAngle = float(new Uniform('cutoffAngle', 0, 0));
            const acosClamped = float(new Uniform('acosClamped', 0, 0));
            const steepness = float(new Uniform('steepness', 0, 0));

            const sub = cutoffAngle.subtract(acosClamped);
            const div = sub.divide(steepness);
            const negMul = float(-1.0).multiply(div);
            const expResult = exp(negMul);
            const subtract = float(1.0).subtract(expResult);
            const maxResult = max(0.0, subtract);
            const final = EE.multiply(maxResult);

            expect(final.toGLSL()).toBe('EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))');
            expect(final.toWGSL()).toBe('EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))');
        });

        it('应该正确处理 float(-1.0).multiply(Vec3) 优化为 -Vec3', () =>
        {
            const vBetaR = vec3(new Uniform('vBetaR', 0, 0));
            const sR = float(new Uniform('sR', 0, 0));
            const vBetaM = vec3(new Uniform('vBetaM', 0, 0));
            const sM = float(new Uniform('sM', 0, 0));

            // float(-1.0).multiply(vBetaR.multiply(sR).add(vBetaM.multiply(sM)))
            // 应该生成 -(vBetaR * sR + vBetaM * sM)
            const mul1 = vBetaR.multiply(sR);
            const mul2 = vBetaM.multiply(sM);
            const add = mul1.add(mul2);
            const negMul = float(-1.0).multiply(add);
            expect(negMul.toGLSL()).toBe('-(vBetaR * sR + vBetaM * sM)');
            expect(negMul.toWGSL()).toBe('-(vBetaR * sR + vBetaM * sM)');
        });
    });
});

