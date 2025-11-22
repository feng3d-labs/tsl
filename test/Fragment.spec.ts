import { describe, expect, it } from 'vitest';
import { vec4 } from '../src/builtin/vec4';
import { Fragment, fragment } from '../src/Fragment';
import { return_ } from '../src/index';

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
            expect(frag.shaderType).toBe('fragment');
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
});

