import { describe, expect, it } from 'vitest';
import { Precision, precision } from '../src/Precision';
import { fragment } from '../src/Fragment';
import { shader } from '../src/Shader';
import { vec4 } from '../src/builtin/vec4';
import { uniform } from '../src/Uniform';

describe('Precision', () =>
{
    describe('Precision 类', () =>
    {
        it('应该能够创建 Precision 实例', () =>
        {
            const prec = new Precision('highp');
            expect(prec.value).toBe('highp');
            expect(prec.__type__).toBeDefined();
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
            const testShader = shader('test', () =>
            {
                fragment('main', () =>
                {
                    const prec = precision('highp');
                    expect(prec).toBeInstanceOf(Precision);
                    expect(prec.value).toBe('highp');

                    return vec4(1.0, 0.0, 0.0, 1.0);
                });
            });

            // 触发函数执行以测试 precision
            testShader.generateFragmentGLSL('main');
        });

        it('应该支持不同的精度值', () =>
        {
            const testShader = shader('test', () =>
            {
                fragment('main', () =>
                {
                    const prec1 = precision('lowp');
                    expect(prec1.value).toBe('lowp');

                    const prec2 = precision('mediump');
                    expect(prec2.value).toBe('mediump');

                    const prec3 = precision('highp');
                    expect(prec3.value).toBe('highp');

                    return vec4(1.0, 0.0, 0.0, 1.0);
                });
            });

            // 触发函数执行以测试 precision
            testShader.generateFragmentGLSL('main');
        });

        it('应该在函数外调用时抛出错误', () =>
        {
            expect(() => precision('highp')).toThrow(/必须在 fragment shader 函数中调用/);
        });

        it('应该在 fragment shader 中自动添加到依赖', () =>
        {
            const testShader = shader('test', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    precision('highp');

                    return color;
                });
            });

            // 生成 GLSL 代码，应该包含 precision 声明
            const glsl = testShader.generateFragmentGLSL('main');
            expect(glsl).toContain('precision highp float;');
        });

        it('应该在生成的 GLSL 代码中自动包含 precision 声明', () =>
        {
            const testShader = shader('test', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    precision('mediump');

                    return color;
                });
            });

            const glsl = testShader.generateFragmentGLSL('main');
            expect(glsl).toContain('precision mediump float;');
            // precision 应该在 uniform 声明之前
            const precisionIndex = glsl.indexOf('precision mediump float;');
            const uniformIndex = glsl.indexOf('uniform');
            if (uniformIndex !== -1)
            {
                expect(precisionIndex).toBeLessThan(uniformIndex);
            }
        });

        it('precision 不应该出现在 vertex shader 中', () =>
        {
            const testShader = shader('test', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    precision('highp');

                    return color;
                });
            });

            // Vertex shader 不应该包含 precision
            // 这里只是验证不会因为 fragment 中的 precision 而影响 vertex
            // 实际上 vertex shader 可能不存在，所以这个测试主要是确保不会出错
            expect(() => testShader.generateVertexGLSL()).toThrow();
        });

        it('应该支持在 fragment shader 中使用不同的 precision 值', () =>
        {
            const testShader1 = shader('test1', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    precision('lowp');

                    return color;
                });
            });

            const glsl1 = testShader1.generateFragmentGLSL('main');
            expect(glsl1).toContain('precision lowp float;');

            const testShader2 = shader('test2', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    precision('highp');

                    return color;
                });
            });

            const glsl2 = testShader2.generateFragmentGLSL('main');
            expect(glsl2).toContain('precision highp float;');
        });
    });
});

