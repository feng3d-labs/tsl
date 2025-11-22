import { describe, expect, it } from 'vitest';
import { Builtin, builtin } from '../../src/builtin/builtin';
import { vec4 } from '../../src/builtin/vec4';

describe('Builtin', () =>
{
    describe('Builtin 类', () =>
    {
        it('应该能够创建 Builtin 实例', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b).toBeInstanceOf(Builtin);
            expect(b.builtinName).toBe('position');
            expect(b.varName).toBe('position_vec4');
        });

        it('应该正确存储 builtinName 和 varName', () =>
        {
            const b = new Builtin('position', 'myPosition');
            expect(b.builtinName).toBe('position');
            expect(b.varName).toBe('myPosition');
        });

        it('应该初始化 dependencies 为空数组', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.dependencies).toEqual([]);
        });

        it('应该初始化 value 为 undefined', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.value).toBeUndefined();
        });
    });

    describe('toGLSL', () =>
    {
        it('应该在 vertex shader 中为 position 返回 gl_Position', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.toGLSL('vertex')).toBe('gl_Position');
        });

        it('应该在 fragment shader 中为 position 抛出错误', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(() => b.toGLSL('fragment')).toThrow('内置变量 position 不能用于 fragment shader');
        });

        it('应该为不支持的内置变量抛出错误', () =>
        {
            // @ts-ignore
            const b = new Builtin('unknown', 'unknown_var');
            expect(() => b.toGLSL('vertex')).toThrow('内置变量 unknown 不支持 GLSL');
        });

        it('应该要求传入 type 参数', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            // type 参数现在是必需的，不传入会报 TypeScript 错误
            // 这里测试传入正确的参数
            expect(b.toGLSL('vertex')).toBe('gl_Position');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该返回用户自定义的变量名', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.toWGSL('vertex')).toBe('position_vec4');
        });

        it('应该返回不同的自定义变量名', () =>
        {
            const b = new Builtin('position', 'myPosition');
            expect(b.toWGSL('vertex')).toBe('myPosition');
        });

        it('应该在 vertex shader 中返回用户自定义的变量名', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.toWGSL('vertex')).toBe('position_vec4');
        });

        it('应该在 fragment shader 中返回用户自定义的变量名', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(b.toWGSL('fragment')).toBe('position_vec4');
        });
    });

    describe('value 属性', () =>
    {
        it('应该能够设置 value', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            expect(b.value).toBe(v);
        });
    });
});

describe('builtin() 函数', () =>
{
    it('应该能够创建 Builtin 实例', () =>
    {
        const result = builtin('position', 'position_vec4');
        expect(result).toBeInstanceOf(Builtin);
        expect(result.builtinName).toBe('position');
        expect(result.varName).toBe('position_vec4');
    });

    it('应该正确设置 builtinName 和 varName', () =>
    {
        const result = builtin('position', 'myPosition');
        expect(result.builtinName).toBe('position');
        expect(result.varName).toBe('myPosition');
    });

    it('应该能够生成正确的 GLSL 代码', () =>
    {
        const result = builtin('position', 'position_vec4');
        expect(result.toGLSL('vertex')).toBe('gl_Position');
    });

    it('应该能够生成正确的 WGSL 代码', () =>
    {
        const result = builtin('position', 'position_vec4');
        expect(result.toWGSL('vertex')).toBe('position_vec4');
    });

    it('应该支持不同的内置变量名称', () =>
    {
        const result1 = builtin('position', 'pos');
        const result2 = builtin('position', 'outputPos');
        expect(result1.varName).toBe('pos');
        expect(result2.varName).toBe('outputPos');
        expect(result1.builtinName).toBe('position');
        expect(result2.builtinName).toBe('position');
    });
});

