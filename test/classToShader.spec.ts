import { describe, expect, it } from 'vitest';
import { classToShaderConfig } from '../src/classToShader';
import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig } from '../src/shaderGenerator';
import { uniform, attribute, func } from '../src/shaderHelpers';

describe('classToShader', () =>
{
    describe('classToShaderConfig', () =>
    {
        it('应该从 FragmentShader 类实例生成正确的配置', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                uniforms = { color: { type: 'vec4', binding: 0, group: 0 } };

                main()
                {
                    return 'color';
                }
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');

            expect(config.type).toBe('fragment');
            expect(config.precision).toBe('highp');
            expect(config.uniforms).toHaveLength(1);
            expect(config.uniforms?.[0].name).toBe('color');
            expect(config.uniforms?.[0].type).toBe('vec4');
            expect(config.main.return).toBe('color');
        });

        it('应该从 FragmentShader 类实例生成正确的 GLSL 代码', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                uniforms = { color: { type: 'vec4', binding: 0, group: 0 } };

                main()
                {
                    return 'color';
                }
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');
            const glsl = generateGLSLFromConfig(config);

            expect(glsl).toContain('precision highp float;');
            expect(glsl).toContain('uniform vec4 color;');
            expect(glsl).toContain('gl_FragColor = color;');
        });

        it('应该从 FragmentShader 类实例生成正确的 WGSL 代码', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                uniforms = { color: { type: 'vec4', binding: 0, group: 0 } };

                main()
                {
                    return 'color';
                }
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');
            const wgsl = generateWGSLFromConfig(config);

            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('@binding(0) @group(0) var<uniform> color : vec4<f32>;');
            expect(wgsl).toContain('return color;');
        });

        it('应该支持 VertexShader 类实例', () =>
        {
            class VertexShader
            {
                attributes = { position: { type: 'vec2', location: 0 } };

                main()
                {
                    return 'vec4(position, 0.0, 1.0)';
                }
            }

            const shader = new VertexShader();
            const config = classToShaderConfig(shader, 'vertex');

            expect(config.type).toBe('vertex');
            expect(config.attributes).toHaveLength(1);
            expect(config.attributes?.[0].name).toBe('position');
            expect(config.attributes?.[0].type).toBe('vec2');
            expect(config.main.return).toBe('vec4(position, 0.0, 1.0)');
        });

        it('应该支持函数调用配置对象', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                uniforms = { color: { type: 'vec4', binding: 0, group: 0 } };

                main()
                {
                    return {
                        function: 'vec4',
                        args: ['1.0', '0.0', '0.0', '1.0'],
                    };
                }
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');

            expect(config.main.return).toBeDefined();
            expect(typeof config.main.return).toBe('object');
            if (typeof config.main.return === 'object' && config.main.return !== null)
            {
                expect('function' in config.main.return).toBe(true);
            }
        });

        it('应该支持使用 uniform() 函数定义 uniform', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                color = uniform('color', 'vec4', 0, 0);

                main()
                {
                    return this.color;
                }
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');

            expect(config.uniforms).toHaveLength(1);
            expect(config.uniforms?.[0].name).toBe('color');
            expect(config.uniforms?.[0].type).toBe('vec4');
            expect(config.uniforms?.[0].binding).toBe(0);
            expect(config.uniforms?.[0].group).toBe(0);
            expect(config.main.return).toBe('color');
        });

        it('应该支持使用 attribute() 函数定义 attribute', () =>
        {
            class VertexShader
            {
                position = attribute('position', 'vec2', 0);

                main()
                {
                    return String(this.position);
                }
            }

            const shader = new VertexShader();
            const config = classToShaderConfig(shader, 'vertex');

            expect(config.attributes).toHaveLength(1);
            expect(config.attributes?.[0].name).toBe('position');
            expect(config.attributes?.[0].type).toBe('vec2');
            expect(config.attributes?.[0].location).toBe(0);
        });

        it('应该支持使用 func() 函数定义 main 函数', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                color = uniform('color', 'vec4', 0, 0);

                main = func('main', () =>
                {
                    return this.color;
                });
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');

            expect(config.type).toBe('fragment');
            expect(config.precision).toBe('highp');
            expect(config.uniforms).toHaveLength(1);
            expect(config.uniforms?.[0].name).toBe('color');
            expect(config.main.return).toBe('color');
        });

        it('应该从使用 func() 定义的 main 函数生成正确的 GLSL 代码', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                color = uniform('color', 'vec4', 0, 0);

                main = func('main', () =>
                {
                    return this.color;
                });
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');
            const glsl = generateGLSLFromConfig(config);

            expect(glsl).toContain('precision highp float;');
            expect(glsl).toContain('uniform vec4 color;');
            expect(glsl).toContain('gl_FragColor = color;');
        });

        it('应该从使用 func() 定义的 main 函数生成正确的 WGSL 代码', () =>
        {
            class FragmentShader
            {
                precision: 'highp' = 'highp';
                color = uniform('color', 'vec4', 0, 0);

                main = func('main', () =>
                {
                    return this.color;
                });
            }

            const shader = new FragmentShader();
            const config = classToShaderConfig(shader, 'fragment');
            const wgsl = generateWGSLFromConfig(config);

            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('@binding(0) @group(0) var<uniform> color : vec4<f32>;');
            expect(wgsl).toContain('return color;');
        });
    });
});

