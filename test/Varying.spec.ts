import { describe, expect, it } from 'vitest';
import { Varying, varying } from '../src/Varying';
import { vec2 } from '../src/builtin/types/vec2';
import { vec4 } from '../src/builtin/types/vec4';
import { vertex } from '../src/Vertex';
import { fragment } from '../src/Fragment';
import { return_ } from '../src/index';
import { assign } from '../src/builtin/assign';
import { builtin } from '../src/builtin/builtin';
import { var_ } from '../src/builtin/var';
import { varyingStruct } from '../src/varyingStruct';

describe('Varying', () =>
{
    describe('Varying 类', () =>
    {
        it('应该能够创建 Varying 实例', () =>
        {
            const v = new Varying(0);
            expect(v.name).toBeUndefined();
            expect(v.location).toBe(0);
        });

        it('应该在没有设置 name 时抛出错误', () =>
        {
            const v = new Varying(0);
            expect(() => v.toGLSL('vertex')).toThrow(/没有设置 name/);
        });

        it('应该在 varyingStruct 中设置 name 并生成 GLSL', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying(0)),
            });
            const v = struct.fields.vColor.dependencies[0] as Varying;
            expect(v.name).toBe('vColor');
            expect(v.toGLSL('vertex')).toBe('varying vec4 vColor;');
            expect(v.toGLSL('fragment')).toBe('varying vec4 vColor;');
        });

        it('应该在 varyingStruct 中设置 name 并生成 WGSL', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying(0)),
            });
            const v = struct.fields.vColor.dependencies[0] as Varying;
            expect(v.name).toBe('vColor');
            expect(v.toWGSL('vertex')).toBe('@location(0) vColor: vec4<f32>');
        });
    });

    describe('varying() 函数', () =>
    {
        it('应该能够创建 varying', () =>
        {
            const v = varying(0);
            expect(v).toBeInstanceOf(Varying);
            expect(v.name).toBeUndefined();
            expect(v.location).toBe(0);
        });

        it('应该在 varyingStruct 中设置 name', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying(0)),
            });
            const v = struct.fields.vColor.dependencies[0] as Varying;
            expect(v.name).toBe('vColor');
            expect(v.location).toBe(0);
        });

        it('应该支持 vec4(varying(...)) 形式', () =>
        {
            const struct = varyingStruct({
                vColor: vec4(varying(0)),
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
                vColor: vec4(varying()),
                vTexCoord: vec2(varying()),
            });

            const vertexShader = vertex('main', () =>
            {
                assign(v.position, vec4(1.0, 0.0, 0.0, 1.0));
                assign(v.vColor, vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
        });

        it('应该能够自动分配多个 varying 的 location', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying()),
                vTexCoord: vec2(varying()),
            });

            const vertexShader = vertex('main', () =>
            {
                assign(v.position, vec4(1.0, 0.0, 0.0, 1.0));
                assign(v.vColor, vec4(1.0, 0.0, 0.0, 1.0));
                assign(v.vTexCoord, vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location 是连续的
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
            expect(wgsl).toMatch(/@location\(1\).*vTexCoord/);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying(2)), // 显式指定 location 2
                vTexCoord: vec2(varying()), // 自动分配
            });

            const vertexShader = vertex('main', () =>
            {
                assign(v.position, vec4(1.0, 0.0, 0.0, 1.0));
                assign(v.vColor, vec4(1.0, 0.0, 0.0, 1.0));
                assign(v.vTexCoord, vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证显式指定的 location 被保留
            expect(wgsl).toContain('@location(2) vColor: vec4<f32>');
            // 验证自动分配的 location（从 0 开始，因为 2 已被占用）
            expect(wgsl).toMatch(/@location\(0\).*vTexCoord/);
        });

        it('应该能够获取有效的 location', () =>
        {
            const v1 = varying();
            const v2 = varying(1);

            const struct = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(v1),
                vTexCoord: vec2(v2),
            });

            const vertexShader = vertex('main', () =>
            {
                assign(struct.position, vec4(1.0, 0.0, 0.0, 1.0));
                assign(struct.vColor, vec4(1.0, 0.0, 0.0, 1.0));
            });
            vertexShader.toWGSL(); // 触发自动分配
            expect(v1.getEffectiveLocation()).toBe(0); // 自动分配的值
            expect(v2.getEffectiveLocation()).toBe(1); // 显式指定
        });
    });
});

