import { describe, expect, it } from 'vitest';
import { Func, func } from '../src/Func';
import { return_ } from '../src/index';
import { vec4 } from '../src/builtin/vec4';

describe('Func', () =>
{
    describe('Func 类', () =>
    {
        it('应该能够创建 Func 实例', () =>
        {
            const funcInstance = new Func('test', () => 'result');
            expect(funcInstance.name).toBe('test');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const funcInstance = new Func('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = funcInstance.toGLSL('vertex');
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const funcInstance = new Func('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = funcInstance.toWGSL('fragment');
            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('func() 函数', () =>
    {
        it('应该能够创建 Func 实例', () =>
        {
            const funcInstance = func('test', () => 'result');
            expect(funcInstance).toBeInstanceOf(Func);
            expect(funcInstance.name).toBe('test');
        });
    });
});

