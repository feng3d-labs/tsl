import { describe, expect, it } from 'vitest';
import { attribute } from '../src/Attribute';
import { uniform } from '../src/Uniform';
import { builtin } from '../src/builtin/builtin';
import { mat4 } from '../src/builtin/types/mat4';
import { vec3 } from '../src/builtin/types/vec3';
import { vec4 } from '../src/builtin/types/vec4';
import { VaryingStruct, varyingStruct } from '../src/varyingStruct';
import { varying } from '../src/Varying';

describe('VaryingStruct', () =>
{
    describe('varyingStruct() 函数', () =>
    {
        it('应该能够创建 VaryingStruct 实例', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            expect(v).toBeInstanceOf(VaryingStruct);
            expect(v.structName).toBe('VaryingStruct');
            expect(Object.keys(v.fields)).toHaveLength(1);
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
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.toWGSLDefinition();

            expect(wgsl).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
        });

        it('应该能够生成正确的 WGSL 代码（字段名与 varName 不同）', () =>
        {
            const v = varyingStruct({
                pos: vec4(builtin('position')),
            });

            const wgsl = v.toWGSLDefinition();

            expect(wgsl).toContain('struct VaryingStruct');
            // 结构体字段使用结构体定义的字段名，而不是 builtin 的 varName
            expect(wgsl).toContain('@builtin(position) pos: vec4<f32>');
        });

        it('应该能够为 vertex 和 fragment 生成相同的结构体定义', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const vertexWgsl = v.toWGSLDefinition();
            const fragmentWgsl = v.toWGSLDefinition();

            expect(vertexWgsl).toBe(fragmentWgsl);
        });

        it('应该能够返回变量名 v', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const vertexWgsl = v.toWGSL('vertex');
            const fragmentWgsl = v.toWGSL('fragment');

            expect(vertexWgsl).toBe('v');
            expect(fragmentWgsl).toBe('v');
        });

        it('应该正确设置 dependencies', () =>
        {
            const position = vec4(builtin('position'));

            const v = varyingStruct({
                position,
            });

            expect(v.dependencies).toHaveLength(1);
            expect(v.dependencies).toContain(position);
        });
    });

    describe('VaryingStruct 类 - GLSL 代码生成', () =>
    {
        it('应该能够生成空的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const vertexGlsl = v.toGLSL('vertex');
            const fragmentGlsl = v.toGLSL('fragment');

            expect(vertexGlsl).toBe('');
            expect(fragmentGlsl).toBe('');
        });
    });

    describe('VaryingStruct 直接使用 - WGSL 代码生成', () =>
    {
        it('应该能够为结构体字段生成正确的 WGSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.position.toWGSL('vertex');
            expect(wgsl).toBe('v.position');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.position.x.toWGSL('vertex');
            expect(wgsl).toBe('v.position.x');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.position.x.toWGSL('vertex');
            expect(wgsl).toBe('v.position.x');

            expect(v.position.xyz.toWGSL('vertex')).toBe('v.position.xyz');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const position = vec4(builtin('position'));

            const v = varyingStruct({
                position,
            });

            expect(v.toWGSLDefinition()).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
            expect(v.toWGSLVarStatement()).toBe('var v: VaryingStruct;');
            expect(v.toWGSL('vertex')).toBe('v');
            expect(position.toWGSL('vertex')).toBe('v.position');
            expect(position.x.toWGSL('vertex')).toBe('v.position.x');
            expect(position.xyz.toWGSL('vertex')).toBe('v.position.xyz');

            expect(v.toWGSLDefinition()).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
            expect(v.toWGSLParam()).toBe('v: VaryingStruct');
            expect(v.toWGSL('fragment')).toBe('v');
            expect(position.toWGSL('fragment')).toBe('v.position');
            expect(position.x.toWGSL('fragment')).toBe('v.position.x');
            expect(position.xyz.toWGSL('fragment')).toBe('v.position.xyz');
        });
    });

    describe('VaryingStruct 直接使用 - GLSL 代码生成', () =>
    {
        it('应该能够为结构体字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const glsl = v.position.toGLSL('vertex');
            expect(glsl).toBe('gl_Position');
        });

        it('应该能够为结构体字段属性生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const glsl = v.position.x.toGLSL('vertex');
            expect(glsl).toBe('gl_Position.x');
        });

        it('应该能够为 Varying 字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                color: vec4(varying(1)),
            });

            const glsl = v.color.toGLSL('vertex');
            expect(glsl).toBe('color');
        });

        it('应该能够为 varyingStruct 字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                color: vec4(varying(1)),
                color2: vec4(varying()),
                color3: vec4(varying(2)),
            });

            // GLSL
            expect(v.color.toGLSL('vertex')).toBe('color');
            expect(v.color2.toGLSL('vertex')).toBe('color2');
            expect(v.color3.toGLSL('vertex')).toBe('color3');

            expect(v.color.toGLSL('fragment')).toBe('color');
            expect(v.color2.toGLSL('fragment')).toBe('color2');
            expect(v.color3.toGLSL('fragment')).toBe('color3');

            expect(v.toGLSL('vertex')).toBe('');
            expect(v.toGLSL('fragment')).toBe('');

            expect(v.toGLSLDefinition('vertex')).toBe('varying vec4 color; varying vec4 color2; varying vec4 color3;');
            expect(v.toGLSLDefinition('fragment')).toBe('varying vec4 color; varying vec4 color2; varying vec4 color3;');

            // WGSL
            expect(v.color.toWGSL('vertex')).toBe('v.color');
            expect(v.color2.toWGSL('vertex')).toBe('v.color2');
            expect(v.color3.toWGSL('vertex')).toBe('v.color3');

            expect(v.color.toWGSL('fragment')).toBe('v.color');
            expect(v.color2.toWGSL('fragment')).toBe('v.color2');
            expect(v.color3.toWGSL('fragment')).toBe('v.color3');

            expect(v.toWGSL('vertex')).toBe('v');
            expect(v.toWGSL('fragment')).toBe('v');

            expect(v.toWGSLVarStatement()).toBe('var v: VaryingStruct;');
            expect(v.toWGSLParam()).toBe('v: VaryingStruct');

            expect(v.toWGSLDefinition('vertex')).toBe('struct VaryingStruct {\n    color: vec4<f32>,\n    color2: vec4<f32>,\n    color3: vec4<f32>,\n}');
            expect(v.toWGSLDefinition('fragment')).toBe('struct VaryingStruct {\n    @location(1) color: vec4<f32>,\n    @location(0) color2: vec4<f32>,\n    @location(2) color3: vec4<f32>,\n}');
        });
    });
});

