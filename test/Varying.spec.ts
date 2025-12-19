import { describe, expect, it } from 'vitest';
import { Varying, varying } from '../src/varying';
import { vec2 } from '../src/builtin/types/vec2';
import { vec4 } from '../src/builtin/types/vec4';
import { vertex } from '../src/vertex';
import { fragment } from '../src/fragment';
import { return_ } from '../src/index';
import { gl_Position } from '../src/builtin/builtins';
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

        it('应该能够生成 GLSL 声明', () =>
        {
            buildShader({ language: 'glsl', stage: 'vertex', version: 1 }, () =>
            {
                const v = vec4(varying('v_color', 0));
                const varyingInstance = v.dependencies[0] as Varying;
                expect(varyingInstance.name).toBe('v_color');
                expect(varyingInstance.toGLSL()).toBe('varying vec4 v_color;');
            });
        });

        it('应该能够生成 WGSL 声明', () =>
        {
            const v = vec4(varying('v_color', 0));
            const varyingInstance = v.dependencies[0] as Varying;
            expect(varyingInstance.name).toBe('v_color');
            expect(varyingInstance.toWGSL()).toBe('@location(0) v_color: vec4<f32>');
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

        it('应该支持 vec4(varying(...)) 形式', () =>
        {
            const vColor = vec4(varying('vColor', 0));

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
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
            const vColor = vec4(varying('vColor'));
            const vTexCoord = vec2(varying('vTexCoord'));

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
            expect(wgsl).toMatch(/@location\(1\).*vTexCoord/);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const vColor = vec4(varying('vColor', 2)); // 显式指定 location 2
            const vTexCoord = vec2(varying('vTexCoord')); // 自动分配

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain('@location(2) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(0) vTexCoord: vec2<f32>');
        });

        it('应该能够获取有效的 location', () =>
        {
            const v1 = varying('vColor');
            const v2 = varying('vTexCoord', 1);
            const vColor = vec4(v1);
            const vTexCoord = vec2(v2);

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });
            vertexShader.toWGSL(); // 触发自动分配
            expect(v1.getEffectiveLocation()).toBe(0); // 自动分配的值
            expect(v2.getEffectiveLocation()).toBe(1); // 显式指定
        });
    });

    describe('独立定义的 varying', () =>
    {
        it('应该能够独立定义 varying 并自动生成 VaryingStruct', () =>
        {
            const v_st = vec2(varying('v_st'));

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v_st.assign(vec2(0.5, 0.5));
            });

            const wgsl = vertexShader.toWGSL();
            // VaryingStruct 应该包含 position builtin 和 varying
            expect(wgsl).toContain('struct VaryingStruct');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('@location(0) v_st: vec2<f32>');
            // 赋值语句应该使用 v.v_st 格式
            expect(wgsl).toContain('v.v_st = ');
        });

        it('应该能够只使用 gl_Position 而不声明任何 varying', () =>
        {
            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 应该生成 VaryingStruct 包含 position builtin
            expect(wgsl).toContain('struct VaryingStruct');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('v.position = ');
        });

        it('应该能够在片段着色器中使用独立 varying', () =>
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
