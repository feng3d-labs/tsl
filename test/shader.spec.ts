import { describe, expect, it } from 'vitest';
import { Shader, shader, attribute, fragment, uniform, vec2, vec4, vertex } from '../src/index';

describe('Shader', () =>
{
    describe('shader() 函数', () =>
    {
        it('应该能够使用 shader() 函数定义着色器', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const position = vec2(attribute('position', 0));
                const color = vec4(uniform('color', 0, 0));

                vertex('main', () =>
                {
                    return vec4(position, 0.0, 1.0);
                });

                fragment('main', () =>
                {
                    return color;
                });
            });

            expect(testShader).toBeInstanceOf(Shader);
            expect(Object.keys(testShader.attributes)).toHaveLength(1);
            expect(Object.keys(testShader.uniforms)).toHaveLength(1);
            expect(Object.keys(testShader.vertexs)).toHaveLength(1);
            expect(Object.keys(testShader.fragments)).toHaveLength(1);
        });
    });

    describe('Shader.generateGLSL', () =>
    {
        it('应该能够生成正确的 vertex shader GLSL 代码', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const position = vec2(attribute('position', 0));

                vertex('main', () =>
                {
                    return vec4(position, 0.0, 1.0);
                });
            });

            const glsl = testShader.generateGLSL('vertex', 'main');

            expect(glsl).toContain('attribute vec2 position;');
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(position, 0.0, 1.0);');
        });

        it('应该能够生成正确的 fragment shader GLSL 代码', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    return color;
                });
            });

            const glsl = testShader.generateGLSL('fragment', 'main');

            expect(glsl).toContain('uniform vec4 color;');
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_FragColor = color;');
        });

        it('应该只包含实际使用的 uniforms 和 attributes', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const pos = vec2(attribute('pos', 0));
                const uv = vec2(attribute('uv', 1));
                const color = vec4(uniform('color', 0, 0));
                const time = vec4(uniform('time', 1, 0));

                vertex('main', () =>
                {
                    return vec4(pos, 1.0);
                });

                fragment('main', () =>
                {
                    return color;
                });
            });

            const vertexGlsl = testShader.generateGLSL('vertex', 'main');
            expect(vertexGlsl).toContain('attribute vec2 pos;');
            // uv 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexGlsl).not.toContain('attribute vec2 uv;');
            // color 和 time 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexGlsl).not.toContain('uniform');

            const fragmentGlsl = testShader.generateGLSL('fragment', 'main');
            expect(fragmentGlsl).toContain('uniform vec4 color;');
            // time 在 fragment shader 中没有使用，所以不应该包含
            expect(fragmentGlsl).not.toContain('uniform vec4 time;');
        });

        it('应该在找不到入口函数时抛出错误', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const color = vec4(uniform('color', 0, 0));
                fragment('main', () =>
                {
                    return color;
                });
            });

            expect(() => testShader.generateGLSL('fragment', 'main')).not.toThrow();
            expect(() => testShader.generateGLSL('vertex', 'main')).toThrow(/未找到顶点着色器/);
            expect(() => testShader.generateGLSL('fragment', 'nonexistent')).toThrow(/未找到片段着色器/);
        });
    });

    describe('Shader.generateWGSL', () =>
    {
        it('应该能够生成正确的 vertex shader WGSL 代码', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const position = vec2(attribute('position', 0));

                vertex('main', () =>
                {
                    return vec4(position, 0.0, 1.0);
                });
            });

            const wgsl = testShader.generateWGSL('vertex', 'main');

            expect(wgsl).toContain('@vertex');
            expect(wgsl).toContain('fn main');
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
            expect(wgsl).toContain('return vec4<f32>(position, 0.0, 1.0);');
        });

        it('应该能够生成正确的 fragment shader WGSL 代码', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const color = vec4(uniform('color', 0, 0));

                fragment('main', () =>
                {
                    return color;
                });
            });

            const wgsl = testShader.generateWGSL('fragment', 'main');

            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main');
            expect(wgsl).toContain('color');
        });

        it('应该只包含实际使用的 uniforms 和 attributes', () =>
        {
            const testShader = shader('testShader', () =>
            {
                const position = vec2(attribute('position', 0));
                const color = vec4(uniform('color', 0, 0));
                const time = vec4(uniform('time', 1, 0));

                vertex('main', () =>
                {
                    return vec4(position, 0.0, 1.0);
                });

                fragment('main', () =>
                {
                    return color;
                });
            });

            const vertexWgsl = testShader.generateWGSL('vertex', 'main');
            expect(vertexWgsl).toContain('@location(0) position: vec2<f32>');
            // color 和 time 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexWgsl).not.toContain('var<uniform> color');
            expect(vertexWgsl).not.toContain('var<uniform> time');

            const fragmentWgsl = testShader.generateWGSL('fragment', 'main');
            expect(fragmentWgsl).toContain('var<uniform> color : vec4<f32>');
            // time 在 fragment shader 中没有使用，所以不应该包含
            expect(fragmentWgsl).not.toContain('var<uniform> time');
        });
    });

});
