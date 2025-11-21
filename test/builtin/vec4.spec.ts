import { describe, expect, it } from 'vitest';
import { convertTypeToWGSL, generateFunctionCallGLSL, generateFunctionCallWGSL, FunctionCallConfig, vec4, Vec4 } from '../../src/builtin/vec4';
import { vec2, Vec2 } from '../../src/builtin/vec2';
import { Uniform } from '../../src/Uniform';
import { Attribute } from '../../src/Attribute';
import { Expression } from '../../src/builtin/Expression';

describe('vec4', () =>
{
    describe('convertTypeToWGSL', () =>
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
                expect(convertTypeToWGSL(glsl)).toBe(wgsl);
            }
        });
    });

    describe('generateFunctionCallGLSL', () =>
    {
        it('应该生成简单的函数调用', () =>
        {
            const color = vec4(1, 0, 0, 1);

            expect(color.toGLSL()).toBe('vec4(1.0, 0.0, 0.0, 1.0)');
        });

        it('应该支持嵌套的函数调用', () =>
        {
            const call: FunctionCallConfig = {
                function: 'vec4',
                args: [
                    {
                        function: 'vec3',
                        args: ['1.0', '0.5', '0.0'],
                    },
                    '1.0',
                ],
            };

            const result = generateFunctionCallGLSL(call);
            expect(result).toBe('vec4(vec3(1.0, 0.5, 0.0), 1.0)');
        });

        it('应该支持数字参数', () =>
        {
            const call: FunctionCallConfig = {
                function: 'vec2',
                args: [1.0, 2.0],
            };

            const result = generateFunctionCallGLSL(call);
            expect(result).toBe('vec2(1, 2)');
        });
    });

    describe('generateFunctionCallWGSL', () =>
    {
        it('应该生成简单的 vec4 函数调用', () =>
        {
            const call: FunctionCallConfig = {
                function: 'vec4',
                args: ['position', '0.0', '1.0'],
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('vec4<f32>(position, 0.0, 1.0)');
        });

        it('应该支持嵌套的函数调用', () =>
        {
            const call: FunctionCallConfig = {
                function: 'vec4',
                args: [
                    {
                        function: 'vec3',
                        args: ['1.0', '0.5', '0.0'],
                    },
                    '1.0',
                ],
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('vec4<f32>(vec3<f32>(1.0, 0.5, 0.0), 1.0)');
        });

        it('应该支持 ivec 类型', () =>
        {
            const call: FunctionCallConfig = {
                function: 'ivec3',
                args: ['1', '2', '3'],
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('vec3<i32>(1, 2, 3)');
        });

        it('应该支持 uvec 类型', () =>
        {
            const call: FunctionCallConfig = {
                function: 'uvec2',
                args: ['1', '2'],
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('vec2<u32>(1, 2)');
        });

        it('应该支持自定义 typeParam', () =>
        {
            const call: FunctionCallConfig = {
                function: 'vec4',
                args: ['1.0', '0.5', '0.0', '1.0'],
                typeParam: 'f32',
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('vec4<f32>(1.0, 0.5, 0.0, 1.0)');
        });

        it('应该支持矩阵类型', () =>
        {
            const call: FunctionCallConfig = {
                function: 'mat2',
                args: ['1.0', '0.0', '0.0', '1.0'],
            };

            const result = generateFunctionCallWGSL(call);
            expect(result).toBe('mat2x2<f32>(1.0, 0.0, 0.0, 1.0)');
        });
    });

    describe('vec4(xy: Vec2, z: number, w: number)', () =>
    {
        it('应该从 Vec2 字面量和两个数字创建 Vec4', () =>
        {
            const xy = vec2(1.0, 2.0);
            const result = vec4(xy, 3.0, 4.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0)');
        });

        it('应该从 Vec2 uniform 和两个数字创建 Expression', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const xy = vec2(uniform);
            const result = vec4(xy, 0.0, 1.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.toGLSL()).toBe('vec4(uPosition, 0.0, 1.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(uPosition, 0.0, 1.0)');
        });

        it('应该从 Vec2 attribute 和两个数字创建 Expression', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const xy = vec2(attribute);
            const result = vec4(xy, 0.0, 1.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.toGLSL()).toBe('vec4(aPosition, 0.0, 1.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(aPosition, 0.0, 1.0)');
        });
    });
});

