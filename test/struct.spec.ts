import { describe, expect, it } from 'vitest';
import { var_ } from '../src';
import { attribute } from '../src/Attribute';
import { uniform } from '../src/Uniform';
import { builtin } from '../src/builtin/builtin';
import { mat4 } from '../src/builtin/types/mat4';
import { vec3 } from '../src/builtin/types/vec3';
import { vec4 } from '../src/builtin/types/vec4';
import { Struct, struct } from '../src/struct';
import { varying } from '../src/Varying';

describe('Struct', () =>
{
    describe('struct() 函数', () =>
    {
        it('应该能够创建 Struct 实例', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            expect(VertexOutput).toBeInstanceOf(Struct);
            expect(VertexOutput.structName).toBe('VertexOutput');
            expect(Object.keys(VertexOutput.fields)).toHaveLength(1);
        });

        it('应该能够处理空字段对象', () =>
        {
            const EmptyStruct = struct('EmptyStruct', {});

            expect(EmptyStruct).toBeInstanceOf(Struct);
            expect(EmptyStruct.structName).toBe('EmptyStruct');
            expect(Object.keys(EmptyStruct.fields)).toHaveLength(0);
            expect(EmptyStruct.dependencies).toHaveLength(0);
        });

        it('应该拒绝非 builtin 类型的字段（attribute）', () =>
        {
            expect(() =>
            {
                struct('Material', {
                    position: vec3(attribute('position', 0)),
                });
            }).toThrow('必须是 builtin 或 varying 类型');
        });

        it('应该拒绝非 builtin 类型的字段（uniform）', () =>
        {
            expect(() =>
            {
                struct('Material', {
                    modelMatrix: mat4(uniform('modelMatrix', 0, 0)),
                });
            }).toThrow('必须是 builtin 或 varying 类型');
        });
    });

    describe('Struct 类 - WGSL 代码生成', () =>
    {
        it('应该能够生成完整的 WGSL 结构体定义', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toBe('struct VertexOutput {\n    @builtin(position) position: vec4<f32>,\n}');
        });

        it('应该能够生成正确的 WGSL 代码（字段名与 varName 不同）', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                pos: vec4(builtin('position', 'position_vec4')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VertexOutput');
            // 结构体字段使用结构体定义的字段名，而不是 builtin 的 varName
            expect(wgsl).toContain('@builtin(position) pos: vec4<f32>');
        });

        it('应该能够为 vertex 和 fragment 生成相同的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const vertexWgsl = VertexOutput.toWGSL('vertex');
            const fragmentWgsl = VertexOutput.toWGSL('fragment');

            expect(vertexWgsl).toBe(fragmentWgsl);
        });

        it('应该正确设置 dependencies', () =>
        {
            const position = vec4(builtin('position', 'position'));

            const VertexOutput = struct('VertexOutput', {
                position,
            });

            expect(VertexOutput.dependencies).toHaveLength(1);
            expect(VertexOutput.dependencies).toContain(position);
        });
    });

    describe('Struct 类 - GLSL 代码生成', () =>
    {
        it('应该能够生成空的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const vertexGlsl = VertexOutput.toGLSL('vertex');
            const fragmentGlsl = VertexOutput.toGLSL('fragment');

            expect(vertexGlsl).toBe('');
            expect(fragmentGlsl).toBe('');
        });
    });

    describe('var_() 函数与 Struct', () =>
    {
        it('应该能够创建 Struct 变量实例', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            expect(output.dependencies).toHaveLength(1);
            expect(output.dependencies[0]).toBe(VertexOutput);
        });

        it('应该能够使用不同的变量名', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output1 = var_('output1', VertexOutput);
            const output2 = var_('output2', VertexOutput);

            expect(output1.toWGSL('vertex')).toBe('output1');
            expect(output2.toWGSL('vertex')).toBe('output2');
        });
    });

    describe('var_() 创建的 Struct 变量 - WGSL 代码生成', () =>
    {
        it('应该能够生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const vertexWgsl = output.toWGSL('vertex');
            const fragmentWgsl = output.toWGSL('fragment');

            expect(vertexWgsl).toBe('output');
            expect(fragmentWgsl).toBe('output');
        });

        it('应该能够为结构体字段生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const wgsl = output.position.toWGSL('vertex');
            expect(wgsl).toBe('output.position');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const wgsl = output.position.x.toWGSL('vertex');
            expect(wgsl).toBe('output.position.x');
        });
    });

    describe('var_() 创建的 Struct 变量 - GLSL 代码生成', () =>
    {
        it('应该能够生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const vertexGlsl = output.toGLSL('vertex');
            const fragmentGlsl = output.toGLSL('fragment');

            expect(vertexGlsl).toBe('');
            expect(fragmentGlsl).toBe('');
        });

        it('应该能够为结构体字段生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const glsl = output.position.toGLSL('vertex');
            expect(glsl).toBe('gl_Position');
        });

        it('应该能够为结构体字段属性生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const glsl = output.position.x.toGLSL('vertex');
            expect(glsl).toBe('gl_Position.x');
        });

        it('应该能够为 Varying 字段生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                color: vec4(varying('vColor', 1)),
            });

            const output = var_('output', VertexOutput);

            const glsl = output.color.toGLSL('vertex');
            expect(glsl).toBe('vColor');
        });
    });
});

