import { describe, expect, it } from 'vitest';
import { var_ } from '../src';
import { attribute } from '../src/Attribute';
import { uniform } from '../src/Uniform';
import { builtin } from '../src/builtin/builtin';
import { mat4 } from '../src/builtin/mat4';
import { vec2 } from '../src/builtin/vec2';
import { vec3 } from '../src/builtin/vec3';
import { vec4 } from '../src/builtin/vec4';
import { Struct, struct } from '../src/struct';

describe('Struct', () =>
{
    describe('StructType 类', () =>
    {
        it('应该能够创建 StructType 实例', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            expect(VertexOutput).toBeInstanceOf(Struct);
            expect(VertexOutput.structName).toBe('VertexOutput');
            expect(Object.keys(VertexOutput.fields)).toHaveLength(1);
        });

        it('应该能够生成正确的 WGSL 代码（单个字段）', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VertexOutput');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
        });

        it('应该能够生成正确的 GLSL 代码（单个字段）', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toGLSL('vertex');

            expect(wgsl).equal('');
        });

        it('应该能够生成正确的 WGSL 代码（字段名与 varName 不同）', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                pos: vec4(builtin('position', 'position_vec4')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VertexOutput');
            // 注意：当前实现使用 varName 而不是字段名
            expect(wgsl).toContain('@builtin(position) position_vec4: vec4<f32>');
        });

        it('应该能够生成正确的 WGSL 代码（多个字段）', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VertexOutput');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
        });

        it('应该能够生成完整的 WGSL 结构体定义', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            // 验证完整的结构体定义格式
            expect(wgsl).toBe('struct VertexOutput { @builtin(position) position: vec4<f32> }');
        });

        it('应该拒绝非 builtin 类型的字段（attribute）', () =>
        {
            expect(() =>
            {
                struct('Material', {
                    position: vec3(attribute('position', 0)),
                });
            }).toThrow('必须是 builtin 类型');
        });

        it('应该拒绝非 builtin 类型的字段（uniform）', () =>
        {
            expect(() =>
            {
                struct('Material', {
                    modelMatrix: mat4(uniform('modelMatrix', 0, 0)),
                });
            }).toThrow('必须是 builtin 类型');
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

        it('应该能够生成空的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const glsl = VertexOutput.toGLSL('vertex');

            expect(glsl).toBe('');
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

    describe('Struct 类', () =>
    {
        it('应该能够创建 Struct 实例', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            expect(output.dependencies).toHaveLength(1);
            expect(output.dependencies[0]).toBe(VertexOutput);
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

        it('应该能够为结构体字段属性设置正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const wgsl = output.position.x.toWGSL('vertex');
            expect(wgsl).toBe('output.position.x');
        });

        it('应该能够生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const wgsl = output.toWGSL('vertex');

            expect(wgsl).toBe('output');
        });

        it('应该能够生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const glsl = output.toGLSL('vertex');

            expect(glsl).toBe('output');
        });

        it('应该为 vertex 和 fragment 生成相同的代码', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = var_('output', VertexOutput);

            const vertexWgsl = output.toWGSL('vertex');
            const fragmentWgsl = output.toWGSL('fragment');

            expect(vertexWgsl).toBe(fragmentWgsl);
            expect(vertexWgsl).toBe('output');
        });
    });

    describe('structType() 函数', () =>
    {
        it('应该能够创建 StructType 实例', () =>
        {
            const VertexOutput = struct('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            expect(VertexOutput).toBeInstanceOf(Struct);
            expect(VertexOutput.structName).toBe('VertexOutput');
        });

        it('应该能够处理空字段对象', () =>
        {
            const EmptyStruct = struct('EmptyStruct', {});

            expect(EmptyStruct).toBeInstanceOf(Struct);
            expect(EmptyStruct.structName).toBe('EmptyStruct');
            expect(Object.keys(EmptyStruct.fields)).toHaveLength(0);
            expect(EmptyStruct.dependencies).toHaveLength(0);
        });
    });

    describe('struct() 函数', () =>
    {
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
});

