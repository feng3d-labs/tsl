import { describe, expect, it } from 'vitest';
import { Uniform, uniform } from '../src/Uniform';
import { vec4 } from '../src/builtin/vec4';
import { shader } from '../src/Shader';

describe('Uniform', () =>
{
    describe('Uniform 类', () =>
    {
        it('应该能够创建 Uniform 实例', () =>
        {
            const uni = new Uniform('color', 0, 0);
            expect(uni.name).toBe('color');
            expect(uni.binding).toBe(0);
            expect(uni.group).toBe(0);
        });

        it('应该在没有设置 value 时抛出错误', () =>
        {
            const uni = new Uniform('color', 0, 0);
            expect(() => uni.toGLSL()).toThrow(/没有设置 value/);
        });

        it('应该能够设置 value 并生成 GLSL', () =>
        {
            const uni = new Uniform('color', 0, 0);
            vec4(uni);
            expect(uni.toGLSL()).toBe('uniform vec4 color;');
        });

        it('应该能够生成 WGSL', () =>
        {
            const uni = new Uniform('color', 0, 0);
            vec4(uni);
            expect(uni.toWGSL()).toBe('@binding(0) @group(0) var<uniform> color : vec4<f32>;');
        });

    });

    describe('uniform() 函数', () =>
    {
        it('应该能够创建 uniform', () =>
        {
            const uni = uniform('color', 0, 0);
            expect(uni).toBeInstanceOf(Uniform);
            expect(uni.name).toBe('color');
            expect(uni.binding).toBe(0);
            expect(uni.group).toBe(0);
        });

        it('应该支持 vec4(uniform(...)) 形式', () =>
        {
            const testShader = shader('test', () =>
            {
                const color = vec4(uniform('color', 0, 0));
                expect(color).toBeDefined();
                expect(color.toGLSL()).toBe('color');
                expect(color.toWGSL()).toBe('color');
            });

            expect(testShader.uniforms['color']).toBeDefined();
            expect(testShader.uniforms['color'].value?.glslType).toBe('vec4');
            expect(testShader.uniforms['color'].value?.wgslType).toBe('vec4<f32>');
        });
    });
});

