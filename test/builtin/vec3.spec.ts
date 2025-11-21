import { describe, expect, it } from 'vitest';
import { vec3 } from '../../src/builtin/vec3';
import { Uniform } from '../../src/Uniform';
import { Attribute } from '../../src/Attribute';
import { Expression } from '../../src/builtin/Expression';

describe('vec3', () =>
{
    describe('vec3(uniform: Uniform)', () =>
    {
        it('应该返回 Expression 实例', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec3(uniform);
            expect(result).toBeInstanceOf(Expression);
        });

        it('应该将 FunctionCallConfig 保存到 uniform.value', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            vec3(uniform);
            expect(uniform.value).toBeDefined();
            expect(uniform.value?.function).toBe('vec3');
            expect(uniform.value?.args).toEqual(['uPosition']);
        });

        it('应该正确设置 Expression 的 config', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec3(uniform);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual(['uPosition']);
        });
    });

    describe('vec3(attribute: Attribute)', () =>
    {
        it('应该返回 Expression 实例', () =>
        {
            const attribute = new Attribute('aPosition', 'vec3', 0);
            const result = vec3(attribute);
            expect(result).toBeInstanceOf(Expression);
        });

        it('应该将 FunctionCallConfig 保存到 attribute.value', () =>
        {
            const attribute = new Attribute('aPosition', 'vec3', 0);
            vec3(attribute);
            expect(attribute.value).toBeDefined();
            expect(attribute.value?.function).toBe('vec3');
            expect(attribute.value?.args).toEqual(['aPosition']);
        });

        it('应该正确设置 Expression 的 config', () =>
        {
            const attribute = new Attribute('aPosition', 'vec3', 0);
            const result = vec3(attribute);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual(['aPosition']);
        });
    });

    describe('vec3(...args)', () =>
    {
        it('应该处理三个数字参数', () =>
        {
            const result = vec3(1.0, 2.0, 3.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual([1.0, 2.0, 3.0]);
        });

        it('应该处理字符串参数', () =>
        {
            const result = vec3('x', 'y', 'z');
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual(['x', 'y', 'z']);
        });

        it('应该处理混合参数', () =>
        {
            const result = vec3(1.0, 'y', 3.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual([1.0, 'y', 3.0]);
        });

        it('应该处理多个参数', () =>
        {
            const result = vec3(1.0, 2.0, 3.0, 4.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args).toEqual([1.0, 2.0, 3.0, 4.0]);
        });

        it('应该处理 Expression 参数', () =>
        {
            const expr = new Expression({ function: 'vec2', args: [1.0, 2.0] });
            const result = vec3(expr, 3.0);
            expect(result).toBeInstanceOf(Expression);
            expect(result.config.function).toBe('vec3');
            expect(result.config.args[0]).toEqual({ function: 'vec2', args: [1.0, 2.0] });
            expect(result.config.args[1]).toBe(3.0);
        });
    });
});

