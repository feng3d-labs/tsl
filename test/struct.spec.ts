import { describe, expect, it } from 'vitest';
import { uniform } from '../src';
import { array, Array as TSLArray } from '../src/array';
import { mat4 } from '../src/builtin/types/mat4';
import { Vec4, vec4 } from '../src/builtin/types/vec4';
import { struct, Struct } from '../src/struct';

describe('Struct', () =>
{
    describe('struct() 函数', () =>
    {
        it('应该能够创建简单结构体', () =>
        {
            const Material = struct('Material', {
                color: vec4,
            });

            expect(typeof Material).toBe('function');
        });

        it('应该能够创建包含多个成员的结构体', () =>
        {
            const Transform = struct('Transform', {
                model: mat4,
                view: mat4,
                projection: mat4,
            });

            expect(typeof Transform).toBe('function');
        });

        it('应该能够创建包含数组成员的结构体', () =>
        {
            const Lights = struct('Lights', {
                positions: array(vec4, 4),
                colors: array(vec4, 4),
            });

            expect(typeof Lights).toBe('function');
        });
    });

    describe('Struct 实例', () =>
    {
        it('应该能够通过 uniform 创建结构体实例', () =>
        {
            const Material = struct('Material', {
                color: vec4,
            });

            const material = Material(uniform('material'));

            expect(material instanceof Struct).toBe(true);
            expect(material.color instanceof Vec4).toBe(true);
        });

        it('应该能够访问简单成员', () =>
        {
            const Material = struct('Material', {
                color: vec4,
                ambient: vec4,
            });

            const material = Material(uniform('material'));

            expect(material.color.toGLSL()).toBe('material.color');
            expect(material.color.toWGSL()).toBe('material.color');
            expect(material.ambient.toGLSL()).toBe('material.ambient');
            expect(material.ambient.toWGSL()).toBe('material.ambient');
        });

        it('应该能够访问数组成员', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4, 2),
            });

            const transform = Transform(uniform('transform'));

            expect(transform.MVP instanceof TSLArray).toBe(true);
            expect(transform.MVP.length).toBe(2);
        });

        it('应该能够通过 index() 访问数组元素', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4, 2),
            });

            const transform = Transform(uniform('transform'));

            expect(transform.MVP.index(0).toGLSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(0).toWGSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(1).toGLSL()).toBe('transform.MVP[1]');
            expect(transform.MVP.index(1).toWGSL()).toBe('transform.MVP[1]');
        });
    });
});
