import { describe, expect, it } from 'vitest';
import { Fragment, fragment } from '../src/Fragment';

describe('Fragment', () =>
{
    describe('Fragment 类', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = new Fragment('main', () => 'color');
            expect(frag.name).toBe('main');
            expect(frag.shaderType).toBe('fragment');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const frag = new Fragment('main', () => 'color');
            const glsl = frag.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_FragColor = color;');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const frag = new Fragment('main', () => 'color');
            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main()');
        });

    });

    describe('fragment() 函数', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = fragment('main', () => 'color');
            expect(frag).toBeInstanceOf(Fragment);
            expect(frag.name).toBe('main');
        });
    });
});

