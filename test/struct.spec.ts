import { describe, expect, it } from 'vitest';
import { var_ } from '../src';
import { attribute } from '../src/Attribute';
import { uniform } from '../src/Uniform';
import { builtin } from '../src/builtin/builtin';
import { mat4 } from '../src/builtin/types/mat4';
import { vec3 } from '../src/builtin/types/vec3';
import { vec4 } from '../src/builtin/types/vec4';
import { VaryingStruct, varyingStruct, struct } from '../src/varyingStruct';
import { varying } from '../src/Varying';

describe('VaryingStruct', () =>
{
    describe('varyingStruct() 函数', () =>
    {
        it('应该能够创建 VaryingStruct 实例', () =>
        {
            const VertexOutput = varyingStruct({
                position: vec4(builtin('position')),
            });

            expect(VertexOutput).toBeInstanceOf(VaryingStruct);
            expect(VertexOutput.structName).toBe('VaryingStruct');
            expect(Object.keys(VertexOutput.fields)).toHaveLength(1);
        });

        it('应该能够处理空字段对象', () =>
        {
            const EmptyStruct = varyingStruct({});

            expect(EmptyStruct).toBeInstanceOf(VaryingStruct);
            expect(EmptyStruct.structName).toBe('VaryingStruct');
            expect(Object.keys(EmptyStruct.fields)).toHaveLength(0);
            expect(EmptyStruct.dependencies).toHaveLength(0);
        });

        it('应该拒绝非 builtin 类型的字段（attribute）', () =>
        {
            expect(() =>
            {
                varyingStruct({
                    position: vec3(attribute('position', 0)),
                });
            }).toThrow('必须是 builtin 或 varying 类型');
        });

        it('应该拒绝非 builtin 类型的字段（uniform）', () =>
        {
            expect(() =>
            {
                varyingStruct({
                    modelMatrix: mat4(uniform('modelMatrix', 0, 0)),
                });
            }).toThrow('必须是 builtin 或 varying 类型');
        });
    });

    describe('VaryingStruct 类 - WGSL 代码生成', () =>
    {
        it('应该能够生成完整的 WGSL 结构体定义', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
        });

        it('应该能够生成正确的 WGSL 代码（字段名与 varName 不同）', () =>
        {
            const VertexOutput = struct({
                pos: vec4(builtin('position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VaryingStruct');
            // 结构体字段使用结构体定义的字段名，而不是 builtin 的 varName
            expect(wgsl).toContain('@builtin(position) pos: vec4<f32>');
        });

        it('应该能够为 vertex 和 fragment 生成相同的 WGSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const vertexWgsl = VertexOutput.toWGSL('vertex');
            const fragmentWgsl = VertexOutput.toWGSL('fragment');

            expect(vertexWgsl).toBe(fragmentWgsl);
        });

        it('应该正确设置 dependencies', () =>
        {
            const position = vec4(builtin('position'));

            const VertexOutput = struct({
                position,
            });

            expect(VertexOutput.dependencies).toHaveLength(1);
            expect(VertexOutput.dependencies).toContain(position);
        });
    });

    describe('VaryingStruct 类 - GLSL 代码生成', () =>
    {
        it('应该能够生成空的 GLSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const vertexGlsl = VertexOutput.toGLSL('vertex');
            const fragmentGlsl = VertexOutput.toGLSL('fragment');

            expect(vertexGlsl).toBe('');
            expect(fragmentGlsl).toBe('');
        });
    });

    describe('var_() 函数与 VaryingStruct', () =>
    {
        it('应该能够创建 VaryingStruct 变量实例', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            expect(output.dependencies).toHaveLength(1);
            expect(output.dependencies[0]).toBe(VertexOutput);
        });

        it('应该能够使用不同的变量名', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output1 = var_(VertexOutput);
            const output2 = var_(VertexOutput);

            expect(output1.toWGSL('vertex')).toBe('v');
            expect(output2.toWGSL('vertex')).toBe('v');
        });
    });

    describe('var_() 创建的 VaryingStruct 变量 - WGSL 代码生成', () =>
    {
        it('应该能够生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const vertexWgsl = output.toWGSL('vertex');
            const fragmentWgsl = output.toWGSL('fragment');

            expect(vertexWgsl).toBe('v');
            expect(fragmentWgsl).toBe('v');
        });

        it('应该能够为结构体字段生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const wgsl = output.position.toWGSL('vertex');
            expect(wgsl).toBe('v.position');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const wgsl = output.position.x.toWGSL('vertex');
            expect(wgsl).toBe('v.position.x');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const wgsl = output.position.x.toWGSL('vertex');
            expect(wgsl).toBe('v.position.x');

            expect(output.position.xyz.toWGSL('vertex')).toBe('v.position.xyz');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const position = vec4(builtin('position'));

            const VertexOutput = struct({
                position,
            });

            const output = var_(VertexOutput);

            const wgsl = position.x.toWGSL('vertex');
            expect(wgsl).toBe('v.position.x');

            expect(position.xyz.toWGSL('vertex')).toBe('output.position.xyz');
        });
    });

    describe('var_() 创建的 VaryingStruct 变量 - GLSL 代码生成', () =>
    {
        it('应该能够生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const vertexGlsl = output.toGLSL('vertex');
            const fragmentGlsl = output.toGLSL('fragment');

            expect(vertexGlsl).toBe('');
            expect(fragmentGlsl).toBe('');
        });

        it('应该能够为结构体字段生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const glsl = output.position.toGLSL('vertex');
            expect(glsl).toBe('gl_Position');
        });

        it('应该能够为结构体字段属性生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct({
                position: vec4(builtin('position')),
            });

            const output = var_(VertexOutput);

            const glsl = output.position.x.toGLSL('vertex');
            expect(glsl).toBe('gl_Position.x');
        });

        it('应该能够为 Varying 字段生成正确的 GLSL 代码', () =>
        {
            const VertexOutput = struct({
                color: vec4(varying(1)),
            });

            const output = var_(VertexOutput);

            const glsl = output.color.toGLSL('vertex');
            expect(glsl).toBe('color');
        });
    });
});

