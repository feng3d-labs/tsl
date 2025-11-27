import { describe, expect, it } from 'vitest';
import { Precision, precision } from '../src/Precision';
import { fragment } from '../src/Fragment';
import { vec4 } from '../src/builtin/types/vec4';
import { uniform } from '../src/Uniform';

describe('Precision', () =>
{
    describe('Precision 类', () =>
    {
        it('应该能够创建 Precision 实例', () =>
        {
            const prec = new Precision('highp');
            expect(prec.value).toBe('highp');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const prec = new Precision('highp');
            expect(prec.toGLSL()).toBe('precision highp float;');

            const precLow = new Precision('lowp');
            expect(precLow.toGLSL()).toBe('precision lowp float;');

            const precMedium = new Precision('mediump');
            expect(precMedium.toGLSL()).toBe('precision mediump float;');
        });

        it('应该能够生成 WGSL 代码（返回空字符串）', () =>
        {
            const prec = new Precision('highp');
            expect(prec.toWGSL()).toBe('');
        });
    });

    describe('precision() 函数', () =>
    {
        it('应该在 fragment shader 中返回 Precision 实例', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                const prec = precision('highp');
                expect(prec).toBeInstanceOf(Precision);
                expect(prec.value).toBe('highp');

                return vec4(1.0, 0.0, 0.0, 1.0);
            });

            // 触发函数执行以测试 precision
            fragmentShader.toGLSL();
        });

        it('应该支持不同的精度值', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                const prec1 = precision('lowp');
                expect(prec1.value).toBe('lowp');

                const prec2 = precision('mediump');
                expect(prec2.value).toBe('mediump');

                const prec3 = precision('highp');
                expect(prec3.value).toBe('highp');

                return vec4(1.0, 0.0, 0.0, 1.0);
            });

            // 触发函数执行以测试 precision
            fragmentShader.toGLSL();
        });

        it('应该在函数外调用时抛出错误', () =>
        {
            expect(() => precision('highp')).toThrow(/必须在 fragment shader 函数中调用/);
        });

        it('应该在 fragment shader 中自动添加到依赖', () =>
        {
            const color = vec4(uniform('color', 0, 0));

            const fragmentShader = fragment('main', () =>
            {
                precision('highp');

                return color;
            });

            // 生成 GLSL 代码，应该包含 precision 声明
            const glsl = fragmentShader.toGLSL();
            expect(glsl).toContain('precision highp float;');
        });

        it('应该在生成的 GLSL 代码中自动包含 precision 声明', () =>
        {
            const color = vec4(uniform('color', 0, 0));

            const fragmentShader = fragment('main', () =>
            {
                precision('mediump');

                return color;
            });

            const glsl = fragmentShader.toGLSL();
            expect(glsl).toContain('precision mediump float;');
            // precision 应该在 uniform 声明之前
            const precisionIndex = glsl.indexOf('precision mediump float;');
            const uniformIndex = glsl.indexOf('uniform');
            if (uniformIndex !== -1)
            {
                expect(precisionIndex).toBeLessThan(uniformIndex);
            }
        });

        it('应该支持在 fragment shader 中使用不同的 precision 值', () =>
        {
            const color1 = vec4(uniform('color', 0, 0));

            const fragmentShader1 = fragment('main', () =>
            {
                precision('lowp');

                return color1;
            });

            const glsl1 = fragmentShader1.toGLSL();
            expect(glsl1).toContain('precision lowp float;');

            const color2 = vec4(uniform('color', 0, 0));

            const fragmentShader2 = fragment('main', () =>
            {
                precision('highp');

                return color2;
            });

            const glsl2 = fragmentShader2.toGLSL();
            expect(glsl2).toContain('precision highp float;');
        });
    });
});

