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
        it('应该在没有设置 value 时抛出错误', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(() => b.toGLSL()).toThrow(/没有设置 value/);
        });

        it('应该在设置 value 后返回空字符串', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            expect(b.toGLSL()).toBe('');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该在没有设置 value 时抛出错误', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            expect(() => b.toWGSL()).toThrow(/没有设置 wgslType/);
        });

        it('应该在没有设置 value.wgslType 时抛出错误', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            // 设置一个没有 wgslType 的 value
            b.value = {} as any;
            expect(() => b.toWGSL()).toThrow(/没有设置 wgslType/);
        });

        it('应该返回正确格式的 WGSL 代码', () =>
        {
            const b = new Builtin('position', 'position_vec4');
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            expect(b.toWGSL()).toBe('@builtin(position) position_vec4: vec4<f32>');
        });

        it('应该返回不同变量名的 WGSL 代码', () =>
        {
            const b = new Builtin('position', 'myPosition');
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            expect(b.toWGSL()).toBe('@builtin(position) myPosition: vec4<f32>');
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
        const result = vec4(builtin('position', 'position_vec4'));
        expect(result.toGLSL('vertex')).toBe('gl_Position');
    });

    it('应该能够生成正确的 WGSL 代码', () =>
    {
        const result = builtin('position', 'position_vec4');
        const v = vec4(1.0, 2.0, 3.0, 4.0);
        result.value = v;
        expect(result.toWGSL()).toBe('@builtin(position) position_vec4: vec4<f32>');
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

