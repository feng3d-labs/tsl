import { describe, expect, it } from 'vitest';
import { vec2 } from '../src/builtin/vec2';
import { vec4 } from '../src/builtin/vec4';
import { Fragment, fragment } from '../src/Fragment';
import { return_ } from '../src/index';
import { varying } from '../src/Varying';
import { vertex } from '../src/Vertex';
import { attribute } from '../src/Attribute';
import { builtin } from '../src/builtin/builtin';
import { assign } from '../src/builtin/assign';
import { var_ } from '../src/builtin/var';

describe('Fragment', () =>
{
    describe('Fragment 类', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(frag.name).toBe('main');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = frag.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('fragment() 函数', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(frag).toBeInstanceOf(Fragment);
            expect(frag.name).toBe('main');
        });
    });

    describe('varying location 自动分配', () =>
    {
        it('应该能够自动分配 varying 的 location', () =>
        {
            const vColor = vec4(varying('vColor'));
            const vTexCoord = vec2(varying('vTexCoord'));

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const wgsl = frag.toWGSL();
            // 验证自动分配的 varying location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
        });

        it('应该能够与 vertex shader 的 varying location 保持一致', () =>
        {
            const aPos = vec2(attribute('aPos'));
            const vColor = vec4(varying('vColor'));
            const vPosition = vec4(builtin('position', 'position_vec4'));

            const vert = vertex('main', () =>
            {
                assign(vPosition, vec4(aPos, 0.0, 1.0));
                assign(vColor, vec4(1.0, 0.0, 0.0, 1.0)); // 实际使用 varying
            });

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const vertexWgsl = vert.toWGSL();
            const fragmentWgsl = frag.toWGSL(vert);

            // 验证 vertex 和 fragment shader 中的 varying location 一致
            const vertexLocationMatch = vertexWgsl.match(/@location\((\d+)\).*vColor/);
            const fragmentLocationMatch = fragmentWgsl.match(/@location\((\d+)\).*vColor/);

            expect(vertexLocationMatch).toBeTruthy();
            expect(fragmentLocationMatch).toBeTruthy();
            expect(vertexLocationMatch![1]).toBe(fragmentLocationMatch![1]);
        });

        it('应该能够混合显式指定和自动分配的 varying location', () =>
        {
            const vColor = vec4(varying('vColor', 1)); // 显式指定 location 1
            const vTexCoord = vec2(varying('vTexCoord')); // 自动分配

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const wgsl = frag.toWGSL();
            // 验证显式指定的 location 被保留
            expect(wgsl).toContain('@location(1) vColor: vec4<f32>');
        });
    });
});

