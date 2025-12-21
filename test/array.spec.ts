import { describe, expect, it } from 'vitest';
import { array } from '../src/array';
import { Array as TSLArray } from '../src/array';
import { mat4 } from '../src/builtin/types/mat4';
import { vec4 } from '../src/builtin/types/vec4';
import { struct } from '../src/struct';
import { uniform } from '../src/uniform';

describe('Array', () =>
{
    describe('array() 函数', () =>
    {
        it('应该能够使用 mat4 函数创建数组类型', () =>
        {
            const arr = array(mat4, 2);
            expect(arr).toBeInstanceOf(TSLArray);
            expect(arr.length).toBe(2);
            expect(arr.glslType).toBe('mat4');
            expect(arr.wgslType).toBe('mat4x4<f32>');
        });

        it('应该能够使用 vec4 函数创建数组类型', () =>
        {
            const arr = array(vec4, 4);
            expect(arr).toBeInstanceOf(TSLArray);
            expect(arr.length).toBe(4);
            expect(arr.glslType).toBe('vec4');
            expect(arr.wgslType).toBe('vec4<f32>');
        });
    });

    describe('Array.index()', () =>
    {
        it('应该能够使用 index() 访问数组元素', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4, 2),
            });

            const transform = Transform(uniform('transform'));
            const mvp0 = transform.MVP.index(0);

            expect(mvp0.toGLSL()).toBe('transform.MVP[0]');
            expect(mvp0.toWGSL()).toBe('Transform.MVP[0]');
        });

        it('应该能够访问不同索引的元素', () =>
        {
            const Material = struct('Material', {
                colors: array(vec4, 4),
            });

            const material = Material(uniform('material'));

            expect(material.colors.index(0).toGLSL()).toBe('material.colors[0]');
            expect(material.colors.index(1).toGLSL()).toBe('material.colors[1]');
            expect(material.colors.index(2).toGLSL()).toBe('material.colors[2]');
            expect(material.colors.index(3).toGLSL()).toBe('material.colors[3]');
        });

    });

    describe('mat4 和 vec4 的静态类型属性', () =>
    {
        it('mat4 应该有 glslType 和 wgslType 属性', () =>
        {
            expect(mat4.glslType).toBe('mat4');
            expect(mat4.wgslType).toBe('mat4x4<f32>');
        });

        it('vec4 应该有 glslType 和 wgslType 属性', () =>
        {
            expect(vec4.glslType).toBe('vec4');
            expect(vec4.wgslType).toBe('vec4<f32>');
        });
    });
});
