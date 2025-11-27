import { describe, expect, it } from 'vitest';
import { Func, func } from '../src/Func';
import { return_ } from '../src/index';
import { vec4 } from '../src/builtin/types/vec4';

describe('Func', () =>
{
    describe('Func 类', () =>
    {
        it('应该能够创建 Func 实例', () =>
        {
            const funcInstance = new Func('test', () => 'result');
            expect(funcInstance.name).toBe('test');
        });

    });
});

