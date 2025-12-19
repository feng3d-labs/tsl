import { describe, expect, it } from 'vitest';
import { gl_FragCoord, gl_FrontFacing, gl_InstanceID, gl_Position, gl_VertexID } from '../../src/builtin/builtins';

describe('预定义 Builtins', () =>
{
    describe('gl_Position', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_Position.toGLSL()).toBe('gl_Position');
        });
    });

    describe('gl_VertexID', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_VertexID.toGLSL()).toBe('uint(gl_VertexID)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            expect(gl_VertexID.toWGSL()).toBe('vertexIndex');
        });
    });

    describe('gl_FragCoord', () =>
    {
        it('gl_FragCoord.x 在 GLSL 和 WGSL 中应该相同', () =>
        {
            const x = gl_FragCoord.x;
            expect(x.toGLSL()).toBe('gl_FragCoord.x');
            expect(x.toWGSL()).toBe('fragCoord.x');
        });

        it('gl_FragCoord.y 在 WGSL 中应该翻转（使用负值）', () =>
        {
            const y = gl_FragCoord.y;
            expect(y.toGLSL()).toBe('gl_FragCoord.y');
            expect(y.toWGSL()).toBe('(-fragCoord.y)');
        });
    });

    describe('gl_InstanceID', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_InstanceID.toGLSL()).toBe('uint(gl_InstanceID)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            expect(gl_InstanceID.toWGSL()).toBe('instanceIndex');
        });
    });

    describe('gl_FrontFacing', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_FrontFacing.toGLSL()).toBe('gl_FrontFacing');
        });
    });
});
