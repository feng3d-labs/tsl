import { describe, expect, it } from 'vitest';
import { attribute } from '../src/attribute';
import { builtin } from '../src/builtin/builtin';
import { gl_Position } from '../src/builtin/builtins';
import { mat4 } from '../src/builtin/types/mat4';
import { var_ } from '../src/builtin/var';
import { vec2 } from '../src/builtin/types/vec2';
import { vec3 } from '../src/builtin/types/vec3';
import { vec4 } from '../src/builtin/types/vec4';
import { uniform } from '../src/uniform';
import { varying } from '../src/varying';
import { Vertex, vertex } from '../src/vertex';
import { return_ } from '../src/index';
import { varyingStruct } from '../src/varyingStruct';

describe('Vertex', () =>
{
    describe('Vertex 类', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert.name).toBe('main');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = vert.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('@vertex');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('vertex() 函数', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert).toBeInstanceOf(Vertex);
            expect(vert.name).toBe('main');
        });
    });

    describe('使用 varyingStruct 的写法', () =>
    {
        it('应该能够生成包含 varying 声明的 GLSL 代码', () =>
        {
            const aVertexColor = vec4(attribute('aVertexColor', 0));
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying(0)),
            });

            const vert = vertex('main', () =>
            {
                const position = var_('position', vec4(1.0, 0.0, 0.0, 1.0));
                v.position.assign(position);
                v.vColor.assign(aVertexColor);
            });

            const glsl = vert.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
            expect(glsl).toContain('gl_Position = position;');
            expect(glsl).toContain('vColor = aVertexColor;');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该能够自动分配 attribute 的 location', () =>
        {
            const aPos = vec2(attribute('aPos'));
            const aColor = vec4(attribute('aColor'));

            const vert = vertex('main', () =>
            {
                return_(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toContain('@location(0) aPos: vec2<f32>');
        });

        it('应该能够自动分配 varying 的 location', () =>
        {
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying()),
                vTexCoord: vec2(varying()),
            });

            const vert = vertex('main', () =>
            {
                v.position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL();
            const wgslDefinition = v.toWGSLDefinition();

            expect(wgsl).toContain(wgslDefinition);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const aPos = vec2(attribute('aPos', 2)); // 显式指定 location 2
            const aColor = vec4(attribute('aColor')); // 自动分配
            const v = varyingStruct({
                position: vec4(builtin('position')),
                vColor: vec4(varying(1)), // 显式指定 location 1
                vTexCoord: vec2(varying()), // 自动分配
            });

            const vert = vertex('main', () =>
            {
                v.position.assign(vec4(aPos, 0.0, 1.0));
                v.vColor.assign(aColor);
            });

            const wgsl = vert.toWGSL();
            expect(wgsl).toContain(v.toWGSLDefinition());
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('@location(1) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(2) aPos: vec2<f32>');
        });

        it('应该使用结构体字段名作为变量名', () =>
        {
            const v = varyingStruct({
                position_vec4: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.position_vec4.z.assign(v.position_vec4.w);
            });

            const wgsl = vert.toWGSL();
            // 验证结构体字段名使用字段名 (position_vec4)
            expect(wgsl).toContain('@builtin(position) position_vec4: vec4<f32>');
            expect(wgsl).toContain('v.position_vec4.z = v.position_vec4.w');
        });
    });

    describe('convertDepth 深度转换', () =>
    {
        it('不使用 convertDepth 时，position 赋值应该保持原样', () =>
        {
            const position = vec4(attribute('position'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(position);
            });

            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('v.vPosition = position;');
            expect(wgsl).not.toContain('_pos_temp');
        });

        it('使用 convertDepth: true 时，应该自动转换深度值', () =>
        {
            const position = vec4(attribute('position'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(position);
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // 验证深度转换代码生成
            expect(wgsl).toContain('let _pos_temp = position;');
            expect(wgsl).toContain('v.vPosition = vec4<f32>(_pos_temp.xy, (_pos_temp.z + 1.0) * 0.5, _pos_temp.w);');
        });

        it('使用 convertDepth: false 时，应该与默认行为相同', () =>
        {
            const position = vec4(attribute('position'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(position);
            });

            const wgslDefault = vert.toWGSL();
            const wgslExplicitFalse = vert.toWGSL({ convertDepth: false });
            expect(wgslDefault).toBe(wgslExplicitFalse);
        });

        it('深度转换应该正确处理复杂表达式', () =>
        {
            const pos = vec2(attribute('pos'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(vec4(pos, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // 验证复杂表达式也能正确处理
            expect(wgsl).toContain('let _pos_temp = vec4<f32>(pos, 0.0, 1.0);');
            expect(wgsl).toContain('v.vPosition = vec4<f32>(_pos_temp.xy, (_pos_temp.z + 1.0) * 0.5, _pos_temp.w);');
        });

        it('深度转换不应影响非 position 的赋值', () =>
        {
            const color = vec4(attribute('color'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
                vColor: vec4(varying()),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v.vColor.assign(color);
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // position 赋值应该有深度转换
            expect(wgsl).toContain('_pos_temp');
            // color 赋值不应该有深度转换
            expect(wgsl).toContain('v.vColor = color;');
        });

        it('GLSL 输出不应受 convertDepth 影响', () =>
        {
            const position = vec4(attribute('position'));
            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(position);
            });

            const glsl = vert.toGLSL(2);
            // GLSL 不需要深度转换，应该保持原样
            expect(glsl).toContain('gl_Position = position;');
            expect(glsl).not.toContain('_pos_temp');
        });
    });

    describe('gl_Position 与 varyingStruct 同时使用', () =>
    {
        it('当同时使用 gl_Position 和 varyingStruct 时，应该自动将 gl_Position 注入到结构体中', () =>
        {
            const aVertexPosition = vec3(attribute('aVertexPosition'));
            const aTextureCoord = vec2(attribute('aTextureCoord'));
            const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
            const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

            const v = varyingStruct({
                vTextureCoord: vec2(varying()),
            });

            const vert = vertex('main', () =>
            {
                const position = var_('position', vec4(aVertexPosition, 1.0));
                gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
                v.vTextureCoord.assign(aTextureCoord);
            });

            const wgsl = vert.toWGSL();

            // 验证结构体定义包含 position builtin
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            // 验证 varying 字段也在结构体中
            expect(wgsl).toContain('@location(0) vTextureCoord: vec2<f32>');
            // 验证 gl_Position 的赋值使用结构体字段
            expect(wgsl).toContain('v.position = uProjectionMatrix * uModelViewMatrix * position');
            // 验证 varying 的赋值也使用结构体字段
            expect(wgsl).toContain('v.vTextureCoord = aTextureCoord');
            // 验证返回结构体
            expect(wgsl).toContain('return v;');
            // 验证没有未声明的 _gl_Position 变量
            expect(wgsl).not.toContain('_gl_Position');
        });

        it('当 varyingStruct 已包含 position builtin 时，不应重复注入', () =>
        {
            const aVertexPosition = vec3(attribute('aVertexPosition'));

            const v = varyingStruct({
                vPosition: vec4(builtin('position')),
            });

            const vert = vertex('main', () =>
            {
                v.vPosition.assign(vec4(aVertexPosition, 1.0));
            });

            const wgsl = vert.toWGSL();

            // 验证只有一个 position builtin 字段
            const positionMatches = wgsl.match(/@builtin\(position\)/g);
            expect(positionMatches).toHaveLength(1);
            // 验证使用 vPosition 字段名
            expect(wgsl).toContain('v.vPosition =');
        });
    });
});

