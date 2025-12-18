import { describe, expect, it } from 'vitest';
import { builtin } from '../../src/builtin/builtin';
import { uint } from '../../src/builtin/types/uint';
import { vec2 } from '../../src/builtin/types/vec2';
import { vec4 } from '../../src/builtin/types/vec4';
import { varyingStruct } from '../../src/varyingStruct';

describe('Builtin', () =>
{
    describe('builtin() 函数创建的实例', () =>
    {
        it('应该能够创建 Builtin 实例', () =>
        {
            const b = builtin('position');
            expect(b.builtinName).toBe('position');
            expect(b.name).toBeUndefined();
        });

        it('应该在 varyingStruct 中设置 name', () =>
        {
            const struct = varyingStruct({
                position: vec4(builtin('position')),
            });
            const b = struct.fields.position.dependencies[0] as any;
            expect(b.builtinName).toBe('position');
            expect(b.name).toBe('position');
        });

        it('应该初始化 dependencies 为空数组', () =>
        {
            const b = builtin('position');
            expect(b.dependencies).toEqual([]);
        });

        it('应该初始化 value 为 undefined', () =>
        {
            const b = builtin('position');
            expect(b.value).toBeUndefined();
        });
    });

    describe('toGLSL', () => {
        it('应该返回正确的 GLSL 代码', () =>
        {
            const b = builtin('position');
            expect(() => b.toGLSL()).not.toThrow();
            expect(b.toGLSL()).toBe('gl_Position');
        });

        it('应该在设置 value 后返回 gl_Position', () =>
        {
            const struct = varyingStruct({
                position: vec4(builtin('position')),
            });
            const v = struct.fields.position;
            expect(v.toGLSL()).toBe('gl_Position');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该在设置 value 后使用默认名称生成正确的 WGSL 代码', () =>
        {
            const b = builtin('position');
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            // 使用默认名称 position
            expect(b.toWGSL()).toBe('@builtin(position) position: vec4<f32>');
        });

        it('应该返回正确格式的 WGSL 代码', () =>
        {
            const struct = varyingStruct({
                position: vec4(builtin('position')),
            });
            const b = struct.fields.position.dependencies[0] as any;
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b.value = v;
            expect(b.toWGSL()).toBe('@builtin(position) position: vec4<f32>');
        });
    });

    describe('value 属性', () =>
    {
        it('应该能够设置 value', () =>
        {
            const b = builtin('position');
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
        const result = builtin('position');
        expect(result.builtinName).toBe('position');
        expect(result.name).toBeUndefined();
    });

    it('应该在 varyingStruct 中设置 name', () =>
    {
        const struct = varyingStruct({
            position: vec4(builtin('position')),
        });
        const b = struct.fields.position.dependencies[0] as any;
        expect(b.builtinName).toBe('position');
        expect(b.name).toBe('position');
    });

    it('应该能够生成正确的 GLSL 代码', () =>
    {
        const struct = varyingStruct({
            position: vec4(builtin('position')),
        });
        const v = struct.fields.position;
        expect(v.toGLSL()).toBe('gl_Position');
    });

    it('应该能够生成正确的 WGSL 代码', () =>
    {
        const struct = varyingStruct({
            position: vec4(builtin('position')),
        });
        const b = struct.fields.position.dependencies[0] as any;
        const v = vec4(1.0, 2.0, 3.0, 4.0);
        b.value = v;
        expect(b.toWGSL()).toBe('@builtin(position) position: vec4<f32>');
    });

    describe('gl_Position 与 position 等价', () =>
    {
        it('应该能够创建 gl_Position builtin', () =>
        {
            const b = builtin('gl_Position');
            expect(b.builtinName).toBe('gl_Position');
            expect(b.isPosition).toBe(true);
        });

        it('gl_Position 和 position 应该生成相同的 GLSL 代码', () =>
        {
            const struct1 = varyingStruct({
                position: vec4(builtin('position')),
            });
            const struct2 = varyingStruct({
                position: vec4(builtin('gl_Position')),
            });
            const v1 = struct1.fields.position;
            const v2 = struct2.fields.position;
            expect(v1.toGLSL()).toBe('gl_Position');
            expect(v2.toGLSL()).toBe('gl_Position');
        });

        it('gl_Position 和 position 应该生成相同的 WGSL 代码', () =>
        {
            const struct1 = varyingStruct({
                position: vec4(builtin('position')),
            });
            const struct2 = varyingStruct({
                position: vec4(builtin('gl_Position')),
            });
            const b1 = struct1.fields.position.dependencies[0] as any;
            const b2 = struct2.fields.position.dependencies[0] as any;
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            b1.value = v;
            b2.value = v;
            expect(b1.toWGSL()).toBe('@builtin(position) position: vec4<f32>');
            expect(b2.toWGSL()).toBe('@builtin(position) position: vec4<f32>');
        });

        it('gl_Position 应该正确映射为 WGSL 的 position', () =>
        {
            const b = builtin('gl_Position');
            expect(b.wgslBuiltinName).toBe('position');
        });
    });

    describe('gl_FragCoord', () =>
    {
        it('应该能够创建 gl_FragCoord builtin', () =>
        {
            const b = builtin('gl_FragCoord');
            expect(b.builtinName).toBe('gl_FragCoord');
            expect(b.isFragCoord).toBe(true);
        });

        it('gl_FragCoord 应该正确映射为 WGSL 的 position', () =>
        {
            const b = builtin('gl_FragCoord');
            expect(b.wgslBuiltinName).toBe('position');
        });

        it('gl_FragCoord 的 defaultName 应该是 fragCoord', () =>
        {
            const b = builtin('gl_FragCoord');
            expect(b.defaultName).toBe('fragCoord');
        });

        it('gl_FragCoord.x 在 GLSL 和 WGSL 中应该相同', () =>
        {
            const fragCoord = vec2(builtin('gl_FragCoord'));
            const x = fragCoord.x;
            expect(x.toGLSL()).toBe('gl_FragCoord.x');
            expect(x.toWGSL()).toBe('fragCoord.x');
        });

        it('gl_FragCoord.y 在 WGSL 中应该翻转（使用负值）', () =>
        {
            const fragCoord = vec2(builtin('gl_FragCoord'));
            const y = fragCoord.y;
            expect(y.toGLSL()).toBe('gl_FragCoord.y');
            expect(y.toWGSL()).toBe('(-fragCoord.y)');
        });

        it('fragCoord 别名应该与 gl_FragCoord 行为一致', () =>
        {
            const fragCoord = vec2(builtin('fragCoord'));
            const y = fragCoord.y;
            expect(y.toGLSL()).toBe('gl_FragCoord.y');
            expect(y.toWGSL()).toBe('(-fragCoord.y)');
        });
    });

    describe('gl_InstanceID / instance_index', () =>
    {
        it('应该能够创建 gl_InstanceID builtin', () =>
        {
            const b = builtin('gl_InstanceID');
            expect(b.builtinName).toBe('gl_InstanceID');
            expect(b.isInstanceIndex).toBe(true);
        });

        it('应该能够创建 instance_index builtin', () =>
        {
            const b = builtin('instance_index');
            expect(b.builtinName).toBe('instance_index');
            expect(b.isInstanceIndex).toBe(true);
        });

        it('gl_InstanceID 应该正确映射为 WGSL 的 instance_index', () =>
        {
            const b = builtin('gl_InstanceID');
            expect(b.wgslBuiltinName).toBe('instance_index');
        });

        it('gl_InstanceID 应该生成正确的 GLSL 代码', () =>
        {
            const b = builtin('gl_InstanceID');
            expect(b.toGLSL()).toBe('gl_InstanceID');
        });

        it('instance_index 应该生成正确的 GLSL 代码', () =>
        {
            const b = builtin('instance_index');
            expect(b.toGLSL()).toBe('gl_InstanceID');
        });

        it('gl_InstanceID 的 defaultName 应该是 instanceIndex', () =>
        {
            const b = builtin('gl_InstanceID');
            expect(b.defaultName).toBe('instanceIndex');
        });

        it('uint(builtin("gl_InstanceID")) 应该生成正确的 GLSL 代码', () =>
        {
            const instanceID = uint(builtin('gl_InstanceID'));
            expect(instanceID.toGLSL()).toBe('uint(gl_InstanceID)');
        });

        it('uint(builtin("gl_InstanceID")) 应该生成正确的 WGSL 代码', () =>
        {
            const instanceID = uint(builtin('gl_InstanceID'));
            expect(instanceID.toWGSL()).toBe('instanceIndex');
        });

        it('gl_InstanceID 应该生成正确的 WGSL builtin 声明', () =>
        {
            const b = builtin('gl_InstanceID');
            const instanceID = uint(b);
            expect(b.toWGSL()).toBe('@builtin(instance_index) instanceIndex: u32');
        });
    });
});

