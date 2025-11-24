import { describe, expect, it } from 'vitest';
import { assign } from '../src/builtin/assign';
import { attribute } from '../src/Attribute';
import { builtin } from '../src/builtin/builtin';
import { var_ } from '../src/builtin/var';
import { vec2 } from '../src/builtin/vec2';
import { vec4 } from '../src/builtin/vec4';
import { varying } from '../src/Varying';
import { Vertex, vertex } from '../src/Vertex';
import { return_ } from '../src/index';

describe('Vertex', () =>
{
    describe('Vertex 类', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert.name).toBe('main');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = vert.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('@vertex');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('vertex() 函数', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert).toBeInstanceOf(Vertex);
            expect(vert.name).toBe('main');
        });
    });

    describe('不使用结构体的写法', () =>
    {
        it('应该能够生成包含 varying 声明的 GLSL 代码', () =>
        {
            const aVertexColor = vec4(attribute('aVertexColor', 0));
            const vColor = vec4(varying('vColor', 0));
            const vPosition = vec4(builtin('position', 'position_vec4'));

            const vert = vertex('main', () =>
            {
                const position = var_('position', vec4(1.0, 0.0, 0.0, 1.0));
                assign(vPosition, position);
                assign(vColor, aVertexColor);
            });

            const glsl = vert.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
            expect(glsl).toContain('gl_Position = position;');
            expect(glsl).toContain('vColor = aVertexColor;');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该能够自动分配 attribute 的 location', () =>
        {
            const aPos = vec2(attribute('aPos'));
            const aColor = vec4(attribute('aColor'));

            const vert = vertex('main', () =>
            {
                return_(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toContain('@location(0) aPos: vec2<f32>');
        });

        it('应该能够自动分配 varying 的 location', () =>
        {
            const vColor = vec4(varying('vColor'));
            const vTexCoord = vec2(varying('vTexCoord'));
            const vPosition = vec4(builtin('position', 'position_vec4'));

            const vert = vertex('main', () =>
            {
                assign(vPosition, vec4(1.0, 0.0, 0.0, 1.0));
                assign(vColor, vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL();
            // 验证自动分配的 varying location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const aPos = vec2(attribute('aPos', 2)); // 显式指定 location 2
            const aColor = vec4(attribute('aColor')); // 自动分配
            const vColor = vec4(varying('vColor', 1)); // 显式指定 location 1
            const vTexCoord = vec2(varying('vTexCoord')); // 自动分配
            const vPosition = vec4(builtin('position', 'position_vec4'));

            const vert = vertex('main', () =>
            {
                assign(vPosition, vec4(aPos, 0.0, 1.0));
                assign(vColor, aColor);
            });

            const wgsl = vert.toWGSL();
            // 验证显式指定的 location 被保留
            expect(wgsl).toContain('@location(2) aPos: vec2<f32>');
            expect(wgsl).toContain('@location(1) vColor: vec4<f32>');
        });
    });
});

