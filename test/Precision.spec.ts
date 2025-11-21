import { describe, expect, it } from 'vitest';
import { precision } from '../src/Precision';
import { shader } from '../src/Shader';

describe('Precision', () =>
{
    describe('precision() 函数', () =>
    {
        it('应该能够设置 precision', () =>
        {
            const testShader = shader('test', () =>
            {
                precision('highp');
            });

            expect(testShader.precision).toBe('highp');
        });

        it('应该支持不同的精度值', () =>
        {
            const testShader1 = shader('test1', () =>
            {
                precision('lowp');
            });
            expect(testShader1.precision).toBe('lowp');

            const testShader2 = shader('test2', () =>
            {
                precision('mediump');
            });
            expect(testShader2.precision).toBe('mediump');
        });
    });
});

