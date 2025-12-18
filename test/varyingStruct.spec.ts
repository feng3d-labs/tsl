import { describe, expect, it } from 'vitest';
import { attribute } from '../src/attribute';
import { uniform } from '../src/uniform';
import { builtin } from '../src/builtin/builtin';
import { bool } from '../src/builtin/types/bool';
import { mat4 } from '../src/builtin/types/mat4';
import { vec3 } from '../src/builtin/types/vec3';
import { vec4 } from '../src/builtin/types/vec4';
import { VaryingStruct, varyingStruct } from '../src/varyingStruct';
import { varying } from '../src/varying';

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

            const vertexWgsl = v.toWGSL();
            const fragmentWgsl = v.toWGSL();

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

            const vertexGlsl = v.toGLSL();
            const fragmentGlsl = v.toGLSL();

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

            const wgsl = v.position.toWGSL();
            expect(wgsl).toBe('v.position');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.position.x.toWGSL();
            expect(wgsl).toBe('v.position.x');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const wgsl = v.position.x.toWGSL();
            expect(wgsl).toBe('v.position.x');

            expect(v.position.xyz.toWGSL()).toBe('v.position.xyz');
        });

        it('应该能够为结构体字段属性生成正确的 WGSL 代码', () =>
        {
            const position = vec4(builtin('position'));

            const v = varyingStruct({
                position,
            });

            expect(v.toWGSLDefinition()).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
            expect(v.toWGSLVarStatement()).toBe('var v: VaryingStruct;');
            expect(v.toWGSL()).toBe('v');
            expect(position.toWGSL()).toBe('v.position');
            expect(position.x.toWGSL()).toBe('v.position.x');
            expect(position.xyz.toWGSL()).toBe('v.position.xyz');

            expect(v.toWGSLDefinition()).toBe('struct VaryingStruct {\n    @builtin(position) position: vec4<f32>,\n}');
            expect(v.toWGSLParam()).toBe('v: VaryingStruct');
            expect(v.toWGSL()).toBe('v');
            expect(position.toWGSL()).toBe('v.position');
            expect(position.x.toWGSL()).toBe('v.position.x');
            expect(position.xyz.toWGSL()).toBe('v.position.xyz');
        });
    });

    describe('VaryingStruct 直接使用 - GLSL 代码生成', () =>
    {
        it('应该能够为结构体字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const glsl = v.position.toGLSL();
            expect(glsl).toBe('gl_Position');
        });
    });

    describe('VaryingStruct - gl_FrontFacing 处理', () =>
    {
        it('应该为片段着色器生成包含 gl_FrontFacing 的结构体定义', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });

            // 从构建上下文获取stage信息，应该返回包含gl_FrontFacing的定义
            const fragmentWgsl = v.toWGSLDefinition();

            // 验证生成的WGSL包含gl_FrontFacing（类型强制为 bool）
            expect(fragmentWgsl).toContain('@builtin(front_facing) gl_FrontFacing: bool');
        });

        it('应该为片段着色器生成包含 gl_FrontFacing 的结构体定义 - 类型验证', () =>
        {
            const v = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });

            // 从构建上下文获取stage信息，应该返回包含gl_FrontFacing的定义
            const fragmentWgsl = v.toWGSLDefinition();

            // 验证生成的WGSL包含正确的类型（gl_FrontFacing 在 WGSL 中强制为 bool 类型）
            expect(fragmentWgsl).toContain('bool');
        });

        it('应该为 vertex 和 fragment 生成不同的结构体定义', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });

            // 显式传递stage参数
            const vertexWgsl = v.toWGSLDefinition('vertex');
            const fragmentWgsl = v.toWGSLDefinition('fragment');

            // 验证两个阶段的定义不同
            expect(vertexWgsl).not.toBe(fragmentWgsl);
            // 验证顶点着色器定义不包含gl_FrontFacing
            expect(vertexWgsl).not.toContain('gl_FrontFacing');
            // 验证片段着色器定义包含gl_FrontFacing
            expect(fragmentWgsl).toContain('gl_FrontFacing');
        });
    });

    describe('VaryingStruct 直接使用 - GLSL 代码生成 (继续)', () =>
    {
        it('应该能够为结构体字段属性生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const glsl = v.position.x.toGLSL();
            expect(glsl).toBe('gl_Position.x');
        });

        it('应该能够为 Varying 字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                color: vec4(varying(1)),
            });

            const glsl = v.color.toGLSL();
            expect(glsl).toBe('color');
        });

        it('应该能够为 varyingStruct 字段生成正确的 GLSL 代码', () =>
        {
            const v = varyingStruct({
                color: vec4(varying(1)),
                color2: vec4(varying()),
                color3: vec4(varying(2)),
                color4: vec4(varying()),

            });

            // GLSL
            expect(v.color.toGLSL()).toBe('color');
            expect(v.color2.toGLSL()).toBe('color2');
            expect(v.color3.toGLSL()).toBe('color3');
            expect(v.color4.toGLSL()).toBe('color4');

            expect(v.color.toGLSL()).toBe('color');
            expect(v.color2.toGLSL()).toBe('color2');
            expect(v.color3.toGLSL()).toBe('color3');
            expect(v.color4.toGLSL()).toBe('color4');

            expect(v.toGLSL()).toBe('');
            expect(v.toGLSL()).toBe('');

            expect(v.toGLSLDefinition()).toBe('varying vec4 color;\nvarying vec4 color2;\nvarying vec4 color3;\nvarying vec4 color4;');

            // WGSL
            expect(v.color.toWGSL()).toBe('v.color');
            expect(v.color2.toWGSL()).toBe('v.color2');
            expect(v.color3.toWGSL()).toBe('v.color3');
            expect(v.color4.toWGSL()).toBe('v.color4');

            expect(v.color.toWGSL()).toBe('v.color');
            expect(v.color2.toWGSL()).toBe('v.color2');
            expect(v.color3.toWGSL()).toBe('v.color3');
            expect(v.color4.toWGSL()).toBe('v.color4');

            expect(v.toWGSL()).toBe('v');
            expect(v.toWGSL()).toBe('v');

            expect(v.toWGSLVarStatement()).toBe('var v: VaryingStruct;');
            expect(v.toWGSLParam()).toBe('v: VaryingStruct');

            expect(v.toWGSLDefinition()).toBe('struct VaryingStruct {\n    @location(1) color: vec4<f32>,\n    @location(0) color2: vec4<f32>,\n    @location(2) color3: vec4<f32>,\n    @location(3) color4: vec4<f32>,\n}');
        });
    });
});

