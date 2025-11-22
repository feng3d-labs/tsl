import { describe, expect, it } from 'vitest';
import { Struct, struct } from '../src/struct';
import { vec2 } from '../src/builtin/vec2';
import { vec4 } from '../src/builtin/vec4';
import { Attribute } from '../src/Attribute';
import { Uniform } from '../src/Uniform';

describe('Struct', () =>
{
    describe('Struct 类', () =>
    {
        it('应该能够创建 Struct 实例', () =>
        {
            // struct('VertexOutput', {
            //     position: vec4(1.0, 2.0, 3.0, 4.0),
            //     color: vec4(1.0, 0.0, 0.0, 1.0),
            // });

            // const fields = {
            //     position: vec4(1.0, 2.0, 3.0, 4.0),
            //     color: vec4(1.0, 0.0, 0.0, 1.0),
            // };
            // const s = new Struct('VertexOutput', fields);
            // expect(s).toBeInstanceOf(Struct);
            // expect(s.name).toBe('VertexOutput');
            // expect(s.fields).toBe(fields);
        });
    });
});