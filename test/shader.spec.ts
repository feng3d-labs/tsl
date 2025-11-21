import { describe, expect, it } from 'vitest';
import { Shader, attribute, fragment, precision, shader, uniform, vertex, FunctionCallConfig } from '../src/index';

describe('shader() 函数式着色器定义', () =>
{
    it('应该能够使用 shader() 函数定义着色器', () =>
    {
        const testShader = shader('testShader', () =>
        {
            precision('highp');

            const position = attribute('position', 'vec2', 0);
            const color = uniform('color', 'vec4', 0, 0);

            vertex('main', () =>
            {
                return {
                    function: 'vec4',
                    args: [String(position), '0.0', '1.0'],
                } as FunctionCallConfig;
            });

            fragment('main', () =>
            {
                return color;
            });
        });

        expect(testShader).toBeInstanceOf(Shader);
        expect(testShader.precision).toBe('highp');
        expect(testShader.attributes).toHaveLength(1);
        expect(testShader.uniforms).toHaveLength(1);
        expect(testShader.vertexs).toHaveLength(1);
        expect(testShader.fragments).toHaveLength(1);
    });

    it('应该能够生成正确的 vertex shader GLSL 代码', () =>
    {
        const testShader = shader('testShader', () =>
        {
            const position = attribute('position', 'vec2', 0);

            vertex('main', () =>
            {
                return {
                    function: 'vec4',
                    args: [String(position), '0.0', '1.0'],
                } as FunctionCallConfig;
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
            precision('highp');
            const color = uniform('color', 'vec4', 0, 0);

            fragment('main', () =>
            {
                return color;
            });
        });

        const glsl = testShader.generateGLSL('fragment', 'main');
        
        expect(glsl).toContain('precision highp float;');
        expect(glsl).toContain('uniform vec4 color;');
        expect(glsl).toContain('void main()');
        expect(glsl).toContain('gl_FragColor = color;');
    });

    it('应该能够生成正确的 vertex shader WGSL 代码', () =>
    {
        const testShader = shader('testShader', () =>
        {
            const position = attribute('position', 'vec2', 0);

            vertex('main', () =>
            {
                return {
                    function: 'vec4',
                    args: [String(position), '0.0', '1.0'],
                } as FunctionCallConfig;
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
            const color = uniform('color', 'vec4', 0, 0);

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

    it('应该能够同时定义 vertex 和 fragment shader', () =>
    {
        const testShader = shader('testShader', () =>
        {
            precision('highp');

            const position = attribute('position', 'vec2', 0);
            const color = uniform('color', 'vec4', 0, 0);

            vertex('main', () =>
            {
                return {
                    function: 'vec4',
                    args: [String(position), '0.0', '1.0'],
                } as FunctionCallConfig;
            });

            fragment('main', () =>
            {
                return color;
            });
        });

        const vertexGlsl = testShader.generateGLSL('vertex', 'main');
        const fragmentGlsl = testShader.generateGLSL('fragment', 'main');

        expect(vertexGlsl).toContain('attribute vec2 position;');
        expect(vertexGlsl).toContain('gl_Position = vec4(position, 0.0, 1.0);');
        
        expect(fragmentGlsl).toContain('precision highp float;');
        expect(fragmentGlsl).toContain('uniform vec4 color;');
        expect(fragmentGlsl).toContain('gl_FragColor = color;');
    });

    it('应该能够直接访问 attribute 和 uniform', () =>
    {
        const testShader = shader('testShader', () =>
        {
            const position = attribute('position', 'vec2', 0);
            const color = uniform('color', 'vec4', 0, 0);

            vertex('main', () =>
            {
                // 验证 position 可以访问
                expect(position).toBeDefined();
                expect(position.name).toBe('position');
                return {
                    function: 'vec4',
                    args: [String(position), '0.0', '1.0'],
                } as FunctionCallConfig;
            });

            fragment('main', () =>
            {
                // 验证 color 可以访问
                expect(color).toBeDefined();
                expect(color.name).toBe('color');
                return color;
            });
        });

        // 生成代码应该成功
        const vertexGlsl = testShader.generateGLSL('vertex', 'main');
        const fragmentGlsl = testShader.generateGLSL('fragment', 'main');

        expect(vertexGlsl).toBeTruthy();
        expect(fragmentGlsl).toBeTruthy();
    });

    it('应该能够处理多个 attributes 和 uniforms', () =>
    {
        const testShader = shader('testShader', () =>
        {
            const pos = attribute('pos', 'vec3', 0);
            const uv = attribute('uv', 'vec2', 1);
            const color = uniform('color', 'vec4', 0, 0);
            const time = uniform('time', 'float', 1, 0);

            vertex('main', () =>
            {
                return {
                    function: 'vec4',
                    args: [String(pos), '1.0'],
                } as FunctionCallConfig;
            });

            fragment('main', () =>
            {
                return color;
            });
        });

        expect(testShader.attributes).toHaveLength(2);
        expect(testShader.uniforms).toHaveLength(2);
        
        const vertexGlsl = testShader.generateGLSL('vertex', 'main');
        expect(vertexGlsl).toContain('attribute vec3 pos;');
        expect(vertexGlsl).toContain('attribute vec2 uv;');
    });

    it('应该在找不到入口函数时抛出错误', () =>
    {
        const testShader = shader('testShader', () =>
        {
            const color = uniform('color', 'vec4', 0, 0);
            // 只定义了 fragment，没有定义 vertex
            fragment('main', () =>
            {
                return color;
            });
        });

        // 应该能找到 fragment
        expect(() => testShader.generateGLSL('fragment', 'main')).not.toThrow();

        // 应该找不到 vertex，抛出错误
        expect(() => testShader.generateGLSL('vertex', 'main')).toThrow(/未找到顶点着色器/);

        // 应该找不到指定名称的函数，抛出错误
        expect(() => testShader.generateGLSL('fragment', 'nonexistent')).toThrow(/未找到片段着色器/);
    });
});

