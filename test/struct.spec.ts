import { describe, expect, it } from 'vitest';
import { builtin } from '../src/builtin/builtin';
import { vec4 } from '../src/builtin/vec4';
import { struct, structType } from '../src/struct';

describe('Struct', () =>
{
    describe('Struct 类', () =>
    {
        it('应该能够创建 Struct 实例', () =>
        {
            const VertexOutput = structType('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const wgsl = VertexOutput.toWGSL('vertex');

            expect(wgsl).toContain('struct VertexOutput');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
        });

        it('应该能够创建 Struct 实例', () =>
        {
            const VertexOutput = structType('VertexOutput', {
                position: vec4(builtin('position', 'position')),
            });

            const output = struct('output', VertexOutput);

            const wgsl = output.toWGSL('vertex');

            expect(wgsl).equal('output');
        });
    });
});

