import { describe, expect, it } from 'vitest';
import { generateUniformsGLSL, generateUniformsWGSL, UniformConfig } from '../src/uniforms';

describe('uniforms', () =>
{
    describe('generateUniformsGLSL', () =>
    {
        it('应该生成单个 uniform', () =>
        {
            const uniforms: UniformConfig[] = [
                {
                    name: 'color',
                    type: 'vec4',
                },
            ];

            const result = generateUniformsGLSL(uniforms);
            expect(result).toEqual(['uniform vec4 color;']);
        });

        it('应该生成多个 uniforms', () =>
        {
            const uniforms: UniformConfig[] = [
                {
                    name: 'color',
                    type: 'vec4',
                },
                {
                    name: 'time',
                    type: 'float',
                },
            ];

            const result = generateUniformsGLSL(uniforms);
            expect(result).toEqual([
                'uniform vec4 color;',
                'uniform float time;',
            ]);
        });

        it('应该处理 undefined', () =>
        {
            const result = generateUniformsGLSL(undefined);
            expect(result).toEqual([]);
        });

        it('应该处理空数组', () =>
        {
            const result = generateUniformsGLSL([]);
            expect(result).toEqual([]);
        });
    });

    describe('generateUniformsWGSL', () =>
    {
        it('应该生成带 binding 和 group 的 uniform', () =>
        {
            const uniforms: UniformConfig[] = [
                {
                    name: 'color',
                    type: 'vec4',
                    binding: 0,
                    group: 0,
                },
            ];

            const result = generateUniformsWGSL(uniforms);
            expect(result).toEqual(['@binding(0) @group(0) var<uniform> color : vec4<f32>;']);
        });

        it('应该生成不带 binding 和 group 的 uniform', () =>
        {
            const uniforms: UniformConfig[] = [
                {
                    name: 'color',
                    type: 'vec4',
                },
            ];

            const result = generateUniformsWGSL(uniforms);
            expect(result).toEqual(['var<uniform> color : vec4<f32>;']);
        });

        it('应该正确转换类型到 WGSL', () =>
        {
            const uniforms: UniformConfig[] = [
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
            ];

            const result = generateUniformsWGSL(uniforms);
            expect(result[0]).toContain('vec4<f32>');
            expect(result[1]).toContain('i32');
            expect(result[2]).toContain('bool');
        });

        it('应该处理 undefined', () =>
        {
            const result = generateUniformsWGSL(undefined);
            expect(result).toEqual([]);
        });

        it('应该处理空数组', () =>
        {
            const result = generateUniformsWGSL([]);
            expect(result).toEqual([]);
        });
    });
});


