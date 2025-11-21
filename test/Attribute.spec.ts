import { describe, expect, it } from 'vitest';
import { Attribute, attribute } from '../src/Attribute';
import { vec2 } from '../src/builtin/vec2';
import { shader } from '../src/Shader';

describe('Attribute', () =>
{
    describe('Attribute 类', () =>
    {
        it('应该能够创建 Attribute 实例', () =>
        {
            const attr = new Attribute('position', 0);
            expect(attr.name).toBe('position');
            expect(attr.location).toBe(0);
        });

        it('应该在没有设置 value 时抛出错误', () =>
        {
            const attr = new Attribute('position', 0);
            expect(() => attr.toGLSL()).toThrow(/没有设置 value/);
        });

        it('应该能够设置 value 并生成 GLSL', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = vec2(attribute('position', 0));
            expect(attr.toGLSL()).toBe('attribute vec2 position;');
        });

        it('应该能够生成 WGSL', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = vec2(attribute('position', 0));
            expect(attr.toWGSL()).toBe('@location(0) position: vec2<f32>');
        });
    });

    describe('attribute() 函数', () =>
    {
        it('应该能够创建 attribute', () =>
        {
            const attr = attribute('position', 0);
            expect(attr).toBeInstanceOf(Attribute);
            expect(attr.name).toBe('position');
            expect(attr.location).toBe(0);
        });

        it('应该支持 vec2(attribute(...)) 形式', () =>
        {
            const testShader = shader('test', () =>
            {
                const position = vec2(attribute('position', 0));
                expect(position).toBeDefined();
                expect(position.toGLSL()).toBe('position');
                expect(position.toWGSL()).toBe('position');
            });

            expect(testShader.attributes['position']).toBeDefined();
            expect(testShader.attributes['position'].value?.glslType).toBe('vec2');
            expect(testShader.attributes['position'].value?.wgslType).toBe('vec2<f32>');
        });
    });
});

