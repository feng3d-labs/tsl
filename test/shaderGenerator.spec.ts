import { describe, it, expect } from 'vitest';
import { generateGLSL, generateWGSL, generateShaders, ShaderConfig } from '../src/shaderGenerator';

describe('shaderGenerator', () =>
{
    describe('generateGLSL', () =>
    {
        it('应该生成正确的 fragment shader GLSL 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                        binding: 0,
                        group: 0,
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const glsl = generateGLSL(config);
            const expected = `precision highp float;
uniform vec4 color;

void main() {
    gl_FragColor = color;
}
`;

            expect(glsl).toBe(expected);
        });

        it('应该生成正确的 vertex shader GLSL 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'vertex',
                attributes: [
                    {
                        name: 'position',
                        type: 'vec2',
                        location: 0,
                    },
                ],
                main: {
                    return: 'vec4(position, 0.0, 1.0)',
                },
            };

            const glsl = generateGLSL(config);
            const expected = `attribute vec2 position;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

            expect(glsl).toBe(expected);
        });

        it('应该支持自定义 body 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                    },
                ],
                main: {
                    body: 'vec4 result = color * 0.5;\n    gl_FragColor = result;',
                },
            };

            const glsl = generateGLSL(config);
            expect(glsl).toContain('vec4 result = color * 0.5;');
            expect(glsl).toContain('gl_FragColor = result;');
        });

        it('应该支持多个 uniforms', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                    },
                    {
                        name: 'time',
                        type: 'float',
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const glsl = generateGLSL(config);
            expect(glsl).toContain('uniform vec4 color;');
            expect(glsl).toContain('uniform float time;');
        });

        it('应该支持不同的精度设置', () =>
        {
            const configLowp: ShaderConfig = {
                type: 'fragment',
                precision: 'lowp',
                main: {
                    return: 'vec4(1.0)',
                },
            };

            const configMediump: ShaderConfig = {
                type: 'fragment',
                precision: 'mediump',
                main: {
                    return: 'vec4(1.0)',
                },
            };

            const glslLowp = generateGLSL(configLowp);
            const glslMediump = generateGLSL(configMediump);

            expect(glslLowp).toContain('precision lowp float;');
            expect(glslMediump).toContain('precision mediump float;');
        });
    });

    describe('generateWGSL', () =>
    {
        it('应该生成正确的 fragment shader WGSL 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                        binding: 0,
                        group: 0,
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const wgsl = generateWGSL(config);
            const expected = `@binding(0) @group(0) var<uniform> color : vec4<f32>;

@fragment
fn main() -> @location(0) vec4f {
    return color;
}
`;

            expect(wgsl).toBe(expected);
        });

        it('应该生成正确的 vertex shader WGSL 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'vertex',
                attributes: [
                    {
                        name: 'position',
                        type: 'vec2',
                        location: 0,
                    },
                ],
                main: {
                    return: 'vec4<f32>(position, 0.0, 1.0)',
                },
            };

            const wgsl = generateWGSL(config);
            const expected = `@vertex
fn main(
    @location(0) position: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    return vec4<f32>(position, 0.0, 1.0);
}
`;

            expect(wgsl).toBe(expected);
        });

        it('应该正确转换类型到 WGSL', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                        binding: 0,
                        group: 0,
                    },
                    {
                        name: 'count',
                        type: 'int',
                        binding: 1,
                        group: 0,
                    },
                    {
                        name: 'flag',
                        type: 'bool',
                        binding: 2,
                        group: 0,
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const wgsl = generateWGSL(config);
            expect(wgsl).toContain('vec4<f32>');
            expect(wgsl).toContain('i32');
            expect(wgsl).toContain('bool');
        });

        it('应该支持多个 attributes', () =>
        {
            const config: ShaderConfig = {
                type: 'vertex',
                attributes: [
                    {
                        name: 'position',
                        type: 'vec2',
                        location: 0,
                    },
                    {
                        name: 'color',
                        type: 'vec3',
                        location: 1,
                    },
                ],
                main: {
                    return: 'vec4<f32>(position, 0.0, 1.0)',
                },
            };

            const wgsl = generateWGSL(config);
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
            expect(wgsl).toContain('@location(1) color: vec3<f32>');
        });

        it('应该支持自定义 body 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                        binding: 0,
                        group: 0,
                    },
                ],
                main: {
                    body: 'let result = color * 0.5;\n    return result;',
                },
            };

            const wgsl = generateWGSL(config);
            expect(wgsl).toContain('let result = color * 0.5;');
            expect(wgsl).toContain('return result;');
        });

        it('应该处理没有 binding 和 group 的 uniform', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const wgsl = generateWGSL(config);
            // 应该只包含 var<uniform>，不包含 @binding 和 @group
            expect(wgsl).toContain('var<uniform> color : vec4<f32>');
            expect(wgsl).not.toContain('@binding');
            expect(wgsl).not.toContain('@group');
        });
    });

    describe('generateShaders', () =>
    {
        it('应该同时生成 GLSL 和 WGSL 代码', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                uniforms: [
                    {
                        name: 'color',
                        type: 'vec4',
                        binding: 0,
                        group: 0,
                    },
                ],
                main: {
                    return: 'color',
                },
            };

            const result = generateShaders(config);

            expect(result.glsl).toBeTruthy();
            expect(result.wgsl).toBeTruthy();
            expect(result.glsl).toContain('precision highp float;');
            expect(result.wgsl).toContain('@fragment');
        });

        it('应该为 vertex shader 生成正确的代码', () =>
        {
            const config: ShaderConfig = {
                type: 'vertex',
                attributes: [
                    {
                        name: 'position',
                        type: 'vec2',
                        location: 0,
                    },
                ],
                main: {
                    return: 'vec4<f32>(position, 0.0, 1.0)',
                },
            };

            const result = generateShaders(config);

            expect(result.glsl).toContain('attribute vec2 position;');
            expect(result.glsl).toContain('gl_Position');
            expect(result.wgsl).toContain('@vertex');
            expect(result.wgsl).toContain('@location(0) position: vec2<f32>');
        });
    });

    describe('类型转换', () =>
    {
        it('应该正确转换所有基本类型', () =>
        {
            const typeTests = [
                { glsl: 'float', wgsl: 'f32' },
                { glsl: 'int', wgsl: 'i32' },
                { glsl: 'uint', wgsl: 'u32' },
                { glsl: 'bool', wgsl: 'bool' },
                { glsl: 'vec2', wgsl: 'vec2<f32>' },
                { glsl: 'vec3', wgsl: 'vec3<f32>' },
                { glsl: 'vec4', wgsl: 'vec4<f32>' },
                { glsl: 'ivec2', wgsl: 'vec2<i32>' },
                { glsl: 'ivec3', wgsl: 'vec3<i32>' },
                { glsl: 'ivec4', wgsl: 'vec4<i32>' },
                { glsl: 'uvec2', wgsl: 'vec2<u32>' },
                { glsl: 'uvec3', wgsl: 'vec3<u32>' },
                { glsl: 'uvec4', wgsl: 'vec4<u32>' },
                { glsl: 'mat2', wgsl: 'mat2x2<f32>' },
                { glsl: 'mat3', wgsl: 'mat3x3<f32>' },
                { glsl: 'mat4', wgsl: 'mat4x4<f32>' },
            ];

            for (const { glsl, wgsl } of typeTests)
            {
                const config: ShaderConfig = {
                    type: 'fragment',
                    precision: 'highp',
                    uniforms: [
                        {
                            name: 'test',
                            type: glsl,
                            binding: 0,
                            group: 0,
                        },
                    ],
                    main: {
                        return: 'vec4(1.0)',
                    },
                };

                const generatedWgsl = generateWGSL(config);
                expect(generatedWgsl).toContain(wgsl);
            }
        });
    });

    describe('边界情况', () =>
    {
        it('应该处理没有 uniforms 的配置', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                main: {
                    return: 'vec4(1.0)',
                },
            };

            const glsl = generateGLSL(config);
            const wgsl = generateWGSL(config);

            expect(glsl).toContain('void main()');
            expect(wgsl).toContain('fn main()');
        });

        it('应该处理没有 attributes 的 vertex shader', () =>
        {
            const config: ShaderConfig = {
                type: 'vertex',
                main: {
                    return: 'vec4(0.0, 0.0, 0.0, 1.0)',
                },
            };

            const wgsl = generateWGSL(config);
            expect(wgsl).toContain('fn main()');
        });

        it('应该处理空的 return 表达式', () =>
        {
            const config: ShaderConfig = {
                type: 'fragment',
                precision: 'highp',
                main: {
                    return: '',
                },
            };

            const glsl = generateGLSL(config);
            expect(glsl).toContain('void main()');
        });
    });
});

