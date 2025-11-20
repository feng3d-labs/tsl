import { describe, expect, it } from 'vitest';
import { generateMainGLSL, generateMainWGSL, MainFunctionConfig } from '../src/main';

describe('main', () =>
{
    describe('generateMainGLSL', () =>
    {
        it('应该生成 fragment shader 的 main 函数（字符串 return）', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    return: 'color',
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('void main() {');
            expect(resultStr).toContain('gl_FragColor = color;');
            expect(resultStr).toContain('}');
        });

        it('应该生成 vertex shader 的 main 函数（字符串 return）', () =>
        {
            const config = {
                type: 'vertex',
                main: {
                    return: 'vec4(position, 0.0, 1.0)',
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('void main() {');
            expect(resultStr).toContain('gl_Position = vec4(position, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该生成 fragment shader 的 main 函数（函数调用对象 return）', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    return: {
                        function: 'vec4',
                        args: ['1.0', '0.5', '0.0', '1.0'],
                    },
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('void main() {');
            expect(resultStr).toContain('gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该生成 vertex shader 的 main 函数（函数调用对象 return）', () =>
        {
            const config = {
                type: 'vertex',
                main: {
                    return: {
                        function: 'vec4',
                        args: ['position', '0.0', '1.0'],
                    },
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('void main() {');
            expect(resultStr).toContain('gl_Position = vec4(position, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该支持自定义 body 代码', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    body: 'vec4 result = color * 0.5;\n    gl_FragColor = result;',
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('void main() {');
            expect(resultStr).toContain('vec4 result = color * 0.5;');
            expect(resultStr).toContain('gl_FragColor = result;');
            expect(resultStr).toContain('}');
        });

        it('应该移除 WGSL 类型参数（<f32>）', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    return: 'vec4<f32>(1.0, 0.0, 0.0, 1.0)',
                } as MainFunctionConfig,
            };

            const result = generateMainGLSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('generateMainWGSL', () =>
    {
        it('应该生成 fragment shader 的 main 函数（字符串 return）', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    return: 'color',
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@fragment');
            expect(resultStr).toContain('fn main() -> @location(0) vec4f {');
            expect(resultStr).toContain('return color;');
            expect(resultStr).toContain('}');
        });

        it('应该生成 vertex shader 的 main 函数（字符串 return）', () =>
        {
            const config = {
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
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@vertex');
            expect(resultStr).toContain('@location(0) position: vec2<f32>');
            expect(resultStr).toContain('-> @builtin(position) vec4<f32>');
            expect(resultStr).toContain('return vec4<f32>(position, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该生成 fragment shader 的 main 函数（函数调用对象 return）', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    return: {
                        function: 'vec4',
                        args: ['1.0', '0.5', '0.0', '1.0'],
                    },
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@fragment');
            expect(resultStr).toContain('fn main() -> @location(0) vec4f {');
            expect(resultStr).toContain('return vec4<f32>(1.0, 0.5, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该生成 vertex shader 的 main 函数（函数调用对象 return）', () =>
        {
            const config = {
                type: 'vertex',
                attributes: [
                    {
                        name: 'position',
                        type: 'vec2',
                        location: 0,
                    },
                ],
                main: {
                    return: {
                        function: 'vec4',
                        args: ['position', '0.0', '1.0'],
                    },
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@vertex');
            expect(resultStr).toContain('@location(0) position: vec2<f32>');
            expect(resultStr).toContain('return vec4<f32>(position, 0.0, 1.0);');
            expect(resultStr).toContain('}');
        });

        it('应该支持多个 attributes', () =>
        {
            const config = {
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
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@location(0) position: vec2<f32>');
            expect(resultStr).toContain('@location(1) color: vec3<f32>');
        });

        it('应该支持自定义 body 代码', () =>
        {
            const config = {
                type: 'fragment',
                main: {
                    body: 'let result = color * 0.5;\n    return result;',
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@fragment');
            expect(resultStr).toContain('fn main() -> @location(0) vec4f {');
            expect(resultStr).toContain('let result = color * 0.5;');
            expect(resultStr).toContain('return result;');
            expect(resultStr).toContain('}');
        });

        it('应该处理没有 attributes 的 vertex shader', () =>
        {
            const config = {
                type: 'vertex',
                main: {
                    return: 'vec4<f32>(0.0, 0.0, 0.0, 1.0)',
                } as MainFunctionConfig,
            };

            const result = generateMainWGSL(config);
            const resultStr = result.join('\n');
            expect(resultStr).toContain('@vertex');
            expect(resultStr).toContain('fn main() -> @builtin(position) vec4<f32>');
        });
    });
});

