import { describe, expect, it } from 'vitest';
import { Attribute, attribute } from '../src/Attribute';
import { vec2 } from '../src/builtin/vec2';
import { shader } from '../src/Shader';
import { vertex } from '../src/Vertex';
import { vec4 } from '../src/builtin/vec4';

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

                vertex('main', () =>
                {
                    return vec4(position, 0.0, 1.0);
                });
            });

            // 验证生成的着色器代码中包含 attribute 声明
            const glsl = testShader.generateVertexGLSL();
            expect(glsl).toContain('attribute vec2 position;');
        });
    });
});

