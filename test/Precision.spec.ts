import { describe, expect, it } from 'vitest';
import { Precision, precision } from '../src/precision';
import { fragment } from '../src/fragment';
import { vec4 } from '../src/builtin/types/vec4';
import { uniform } from '../src/uniform';
import { sampler2D, sampler2DArray } from '../src/sampler';
import { texture } from '../src/builtin/texture';
import { int } from '../src/builtin/types/int';
import { vec2 } from '../src/builtin/types/vec2';
import { vec3 } from '../src/builtin/types/vec3';
import { return_ } from '../src/builtin/return';

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

        it('应该支持指定类型的 precision', () =>
        {
            const prec = new Precision('highp', 'float');
            expect(prec.type).toBe('float');
            expect(prec.toGLSL()).toBe('precision highp float;');

            const precInt = new Precision('highp', 'int');
            expect(precInt.type).toBe('int');
            expect(precInt.toGLSL()).toBe('precision highp int;');

            const precSampler = new Precision('lowp', 'sampler2DArray');
            expect(precSampler.type).toBe('sampler2DArray');
            expect(precSampler.toGLSL()).toBe('precision lowp sampler2DArray;');
        });

        it('应该支持 precision 函数指定类型（但只有在使用相应类型时才生成 precision）', () =>
        {
            const diffuse = sampler2DArray('diffuse');
            const coord = vec2(0.5, 0.5);
            const layer = int(uniform('layer')); // 使用 int 类型

            const fragmentShader = fragment('main', () =>
            {
                precision('highp', 'float');
                precision('highp', 'int');
                precision('lowp', 'sampler2DArray'); // 显式设置，并且使用了纹理数组

                return_(texture(diffuse, coord, layer));
            });

            const glsl = fragmentShader.toGLSL(2);
            expect(glsl).toContain('precision highp float;');
            expect(glsl).toContain('precision highp int;'); // 因为使用了 int 类型
            // 只有在使用纹理数组时才生成 sampler2DArray precision
            expect(glsl).toContain('precision lowp sampler2DArray;');
        });

        it('应该在没有设置 precision 时使用默认值', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                return vec4(1.0, 0.0, 0.0, 1.0);
            });

            const glsl = fragmentShader.toGLSL(2);
            // 应该使用默认的 highp float
            expect(glsl).toContain('precision highp float;');
            // 不应该包含 int precision（因为没有使用 int 类型）
            expect(glsl).not.toContain('precision highp int;');
            // 不应该包含 sampler2DArray precision（因为没有使用纹理数组）
            expect(glsl).not.toContain('sampler2DArray');
        });

        it('应该在没有设置 sampler2DArray precision 时使用默认值（如果存在 sampler2DArray）', () =>
        {
            const diffuse = sampler2DArray('diffuse');
            const coord = vec3(0.5, 0.5, 1.0);

            const fragmentShader = fragment('main', () =>
            {
                precision('highp', 'float');
                precision('highp', 'int');
                // 不设置 sampler2DArray precision，但使用了纹理数组（vec3坐标）

                return_(texture(diffuse, coord));
            });

            const glsl = fragmentShader.toGLSL(2);
            // 应该使用默认的 lowp sampler2DArray（因为使用了纹理数组）
            expect(glsl).toContain('precision lowp sampler2DArray;');
        });

        it('应该在没有使用纹理数组时不生成 sampler2DArray precision（即使显式设置）', () =>
        {
            const diffuse = sampler2D('diffuse');
            const coord = vec2(0.5, 0.5);

            const fragmentShader = fragment('main', () =>
            {
                precision('highp', 'float');
                precision('highp', 'int');
                precision('lowp', 'sampler2DArray'); // 显式设置，但没有使用纹理数组

                return_(texture(diffuse, coord));
            });

            const glsl = fragmentShader.toGLSL(2);
            // 不应该包含 sampler2DArray precision（因为没有使用纹理数组）
            expect(glsl).not.toContain('precision lowp sampler2DArray;');
            expect(glsl).not.toContain('sampler2DArray');
        });

        it('应该在没有使用 int 类型时不生成 int precision（即使显式设置）', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                precision('highp', 'float');
                precision('highp', 'int'); // 显式设置，但没有使用 int 类型

                return vec4(1.0, 0.0, 0.0, 1.0);
            });

            const glsl = fragmentShader.toGLSL(2);
            expect(glsl).toContain('precision highp float;');
            // 不应该包含 int precision（因为没有使用 int 类型）
            expect(glsl).not.toContain('precision highp int;');
        });
    });
});

