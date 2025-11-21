import { describe, expect, it } from 'vitest';
import { Attribute, attribute } from '../src/Attribute';
import { vec2 } from '../src/builtin/vec4';
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
            attr.value = {
                function: 'vec2',
                args: ['position'],
            };
            expect(attr.toGLSL()).toBe('attribute vec2 position;');
        });

        it('应该能够生成 WGSL', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = {
                function: 'vec2',
                args: ['position'],
            };
            expect(attr.toWGSL()).toBe('@location(0) position: vec2<f32>');
        });

        it('应该能够转换为配置', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = {
                function: 'vec2',
                args: ['position'],
            };
            const config = attr.toConfig();
            expect(config.name).toBe('position');
            expect(config.type).toBe('vec2');
            expect(config.location).toBe(0);
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
                expect(position).toHaveProperty('function', 'vec2');
            });

            expect(testShader.attributes['position']).toBeDefined();
            expect(testShader.attributes['position'].value?.function).toBe('vec2');
        });
    });
});

