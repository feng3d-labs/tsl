import { describe, expect, it } from 'vitest';
import { assign } from '../src/builtin/assign';
import { color } from '../src/builtin/color';
import { vec4 } from '../src/builtin/types/vec4';
import { Fragment, fragment } from '../src/Fragment';
import { fragmentOutput } from '../src/fragmentOutput';

describe('fragmentOutput', () =>
{
    describe('fragmentOutput 函数', () =>
    {
        it('应该能够创建 FragmentOutput 实例', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
            });

            expect(f).toBeDefined();
            expect(f.red).toBeDefined();
            expect(f.green).toBeDefined();
        });

        it('应该能够访问 FragmentOutput 的字段', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
                blue: vec4(color(2)),
            });

            expect(f.red).toBeDefined();
            expect(f.green).toBeDefined();
            expect(f.blue).toBeDefined();
        });

        it('应该在字段值不是 Vec4 时抛出错误', () =>
        {
            expect(() =>
            {
                fragmentOutput({
                    // @ts-expect-error - 测试错误情况
                    red: color(0),
                });
            }).toThrow(/必须是 Vec4 类型/);
        });

        it('应该在字段值没有 Color 依赖时抛出错误', () =>
        {
            expect(() =>
            {
                fragmentOutput({
                    // @ts-expect-error - 测试错误情况
                    red: vec4(1.0, 0.0, 0.0, 1.0),
                });
            }).toThrow(/没有依赖项|必须是 Color 类型/);
        });
    });

    describe('FragmentOutput GLSL 生成', () =>
    {
        it('应该能够生成 GLSL 多输出声明', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
                blue: vec4(color(2)),
            });

            const frag = fragment('main', () =>
            {
                assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
                assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
                assign(f.blue, vec4(0.0, 0.0, 0.8, 1.0));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('layout(location = 0) out vec4 red;');
            expect(glsl).toContain('layout(location = 1) out vec4 green;');
            expect(glsl).toContain('layout(location = 2) out vec4 blue;');
            expect(glsl).toContain('red = vec4(0.5, 0.0, 0.0, 1.0);');
            expect(glsl).toContain('green = vec4(0.0, 0.3, 0.0, 1.0);');
            expect(glsl).toContain('blue = vec4(0.0, 0.0, 0.8, 1.0);');
        });
    });

    describe('FragmentOutput WGSL 生成', () =>
    {
        it('应该能够生成 WGSL 结构体定义', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
                blue: vec4(color(2)),
            });

            const frag = fragment('main', () =>
            {
                assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
                assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
                assign(f.blue, vec4(0.0, 0.0, 0.8, 1.0));
            });

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('struct FragmentOut {');
            expect(wgsl).toContain('@location(0) red: vec4<f32>,');
            expect(wgsl).toContain('@location(1) green: vec4<f32>,');
            expect(wgsl).toContain('@location(2) blue: vec4<f32>,');
        });

        it('应该能够生成 WGSL 函数返回类型', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
            });

            const frag = fragment('main', () =>
            {
                assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
                assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
            });

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('fn main() -> FragmentOut {');
        });

        it('应该能够生成 WGSL 函数体中的结构体变量和返回语句', () =>
        {
            const f = fragmentOutput({
                red: vec4(color(0)),
                green: vec4(color(1)),
                blue: vec4(color(2)),
            });

            const frag = fragment('main', () =>
            {
                assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
                assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
                assign(f.blue, vec4(0.0, 0.0, 0.8, 1.0));
            });

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var output: FragmentOut;');
            expect(wgsl).toContain('output.red = vec4<f32>(0.5, 0.0, 0.0, 1.0);');
            expect(wgsl).toContain('output.green = vec4<f32>(0.0, 0.3, 0.0, 1.0);');
            expect(wgsl).toContain('output.blue = vec4<f32>(0.0, 0.0, 0.8, 1.0);');
            expect(wgsl).toContain('return output;');
        });
    });
});

