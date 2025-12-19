import { describe, expect, it } from 'vitest';
import { Varying, varying } from '../src/varying';
import { vec2 } from '../src/builtin/types/vec2';
import { vec4 } from '../src/builtin/types/vec4';
import { vertex } from '../src/vertex';
import { fragment } from '../src/fragment';
import { return_ } from '../src/index';
import { builtin } from '../src/builtin/builtin';
import { varyingStruct } from '../src/varyingStruct';
import { buildShader } from '../src/buildShader';

describe('Varying', () =>
{
    describe('Varying 类', () =>
    {
        it('应该能够创建 Varying 实例', () =>
        {
            const v = new Varying('vColor', 0);
            expect(v.name).toBe('vColor');
            expect(v.location).toBe(0);
        });

        it('应该能够创建不指定 location 的 Varying', () =>
        {
            const v = new Varying('vColor');
            expect(v.name).toBe('vColor');
            expect(v.location).toBeUndefined();
        });

        it('应该在 varyingStruct 中保持自身名称并生成 GLSL', () =>
        {
            buildShader({ language: 'glsl', stage: 'vertex', version: 1 }, () =>
            {
                const struct = varyingStruct({
                    vColor: vec4(varying('v_color', 0)),
                });
                const v = struct.fields.vColor.dependencies[0] as Varying;
                // varyingStruct 不再覆盖 varying 的名称，varying 保持自身名称
                expect(v.name).toBe('v_color');
                expect(v.toGLSL()).toBe('varying vec4 v_color;');
            });
        });

        it('应该在 varyingStruct 中保持自身名称并生成 WGSL', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying('v_color', 0)),
            });
            const v = struct.fields.vColor.dependencies[0] as Varying;
            // varying 保持自身的名称
            expect(v.name).toBe('v_color');
            expect(v.toWGSL()).toBe('@location(0) v_color: vec4<f32>');
        });
    });

    describe('varying() 函数', () =>
    {
        it('应该能够创建 varying（指定名称和 location）', () =>
        {
            const v = varying('vColor', 0);
            expect(v).toBeInstanceOf(Varying);
            expect(v.name).toBe('vColor');
            expect(v.location).toBe(0);
        });

        it('应该能够创建 varying（只指定名称）', () =>
        {
            const v = varying('vColor');
            expect(v).toBeInstanceOf(Varying);
            expect(v.name).toBe('vColor');
            expect(v.location).toBeUndefined();
        });

        it('应该在 varyingStruct 中保持自身名称', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying('v_color', 0)),
            });
            const v = struct.fields.vColor.dependencies[0] as Varying;
            // varyingStruct 不再覆盖名称，varying 保持自身名称
            expect(v.name).toBe('v_color');
            expect(v.location).toBe(0);
        });

        it('应该支持 vec4(varying(...)) 形式', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying('vColor', 0)),
            });
            const vColor = struct.fields.vColor;

            const vertexShader = vertex('main', () =>
            {
                return_(vColor);
            });

            // 验证生成的着色器代码中包含 varying 声明
            const glsl = vertexShader.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该支持 location 缺省时的自动分配', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying('vColor')),
                vTexCoord: vec2(varying('vTexCoord')),
            });

            const vertexShader = vertex('main', () =>
            {
                v.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
        });

        it('应该能够自动分配多个 varying 的 location', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying('vColor')),
                vTexCoord: vec2(varying('vTexCoord')),
            });

            const vertexShader = vertex('main', () =>
            {
                v.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain(v.toWGSLDefinition());
            expect(wgsl).toContain('@location(0) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(1) vTexCoord: vec2<f32>');
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying('vColor', 2)), // 显式指定 location 2
                vTexCoord: vec2(varying('vTexCoord')), // 自动分配
            });

            const vertexShader = vertex('main', () =>
            {
                v.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain('@location(2) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(0) vTexCoord: vec2<f32>');
        });

        it('应该能够获取有效的 location', () =>
        {
            const v1 = varying('vColor');
            const v2 = varying('vTexCoord', 1);

            const struct = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(v1),
                vTexCoord: vec2(v2),
            });

            const vertexShader = vertex('main', () =>
            {
                struct.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                struct.vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });
            vertexShader.toWGSL(); // 触发自动分配
            expect(v1.getEffectiveLocation()).toBe(0); // 自动分配的值
            expect(v2.getEffectiveLocation()).toBe(1); // 显式指定
        });
    });

    describe('独立定义的 varying', () =>
    {
        it('应该能够独立定义 varying 并自动合并到 VaryingStruct', () =>
        {
            const v_st = vec2(varying('v_st'));

            const v = varyingStruct({
                position: vec4(builtin('position')),
            });

            const vertexShader = vertex('main', () =>
            {
                v.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v_st.assign(vec2(0.5, 0.5));
            });

            const wgsl = vertexShader.toWGSL();
            // 独立的 varying 应该被合并到 VaryingStruct 中
            expect(wgsl).toContain('@location(0) v_st: vec2<f32>');
            // 赋值语句应该使用 v.v_st 格式
            expect(wgsl).toContain('v.v_st = ');
        });

        it('应该能够在片段着色器中使用独立 varying（无 varyingStruct 引用）', () =>
        {
            const v_st = vec2(varying('v_st'));

            const fragmentShader = fragment('main', () =>
            {
                return_(vec4(v_st.x, v_st.y, 0.0, 1.0));
            });

            const glsl = fragmentShader.toGLSL(2);
            // GLSL 应该声明 varying
            expect(glsl).toContain('in vec2 v_st;');

            const wgsl = fragmentShader.toWGSL();
            // WGSL 应该生成 VaryingStruct 并在函数中接收
            expect(wgsl).toContain('struct VaryingStruct');
            expect(wgsl).toContain('@location(0) v_st: vec2<f32>');
            expect(wgsl).toContain('v: VaryingStruct');
            // 应该使用 v.v_st 访问
            expect(wgsl).toContain('v.v_st');
        });
    });
});
