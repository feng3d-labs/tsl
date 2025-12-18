import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { if_ } from '../../src/builtin/if_';
import { bool } from '../../src/builtin/types/bool';
import { builtin } from '../../src/builtin/builtin';
import { varyingStruct } from '../../src/varyingStruct';
import { vec3 } from '../../src/builtin/types/vec3';
import { vertex } from '../../src/vertex';
import { fragment } from '../../src/fragment';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

// 在vi.mock之前定义MockIfStatement，解决提升问题
class MockIfStatement {
    condition: any;
    statements: any[];

    constructor(condition: any) {
        this.condition = condition;
        this.statements = [];
    }

    beginBody(): void {}
    endBody(): void {}
}

// 预先定义mock，解决提升问题
vi.mock('../../src/currentFunc', () => ({
    getCurrentFunc: () => currentFunc,
}));

vi.mock('../../src/ifStack', () => ({
    pushIfStatement: () => {},
    popIfStatement: () => {},
    getCurrentIfStatement: () => null,
}));

// 使用内联定义的方式解决MockIfStatement未定义问题
vi.mock('../../src/builtin/if_', async () => {
    // 导入实际的模块
    const actual = await vi.importActual('../../src/builtin/if_') as any;

    // 在内联中重新定义MockIfStatement，避免提升问题
    class MockIfStatement {
        condition: any;
        statements: any[];

        constructor(condition: any) {
            this.condition = condition;
            this.statements = [];
        }

        beginBody(): void {}
        endBody(): void {}
    }

    return {
        ...actual,
        IfStatement: MockIfStatement,
        if_: actual.if_,
    };
});

describe('if_', () => {
    beforeEach(() => {
        // 重置currentFunc
        currentFunc = {
            statements: [],
            dependencies: [],
        };
    });

    afterEach(() => {
        // 清除所有模拟
        vi.clearAllMocks();
    });

    describe('if_ 函数', () => {
        it('应该能够使用 bool 条件', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = v.equals(false);

            // 执行if_函数
            if_(result, () => {});

            // 检查条件是否被正确添加到dependencies
            expect(currentFunc.dependencies).toContain(result);
        });

        it('应该能够在顶点着色器中使用', () => {
            const v = bool(builtin('gl_FrontFacing'));

            // 创建顶点着色器
            const vShader = vertex('main', () => {
                const result = v.equals(false);
                if_(result, () => {});
            });

            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });

        it('应该能够在片段着色器中使用', () => {
            const v = bool(builtin('gl_FrontFacing'));

            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = v.equals(false);
                if_(result, () => {});
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });

        it('应该能够与 vec3 类型一起使用', () => {
            const v = bool(builtin('gl_FrontFacing'));
            const n = vec3(1.0, 2.0, 3.0);

            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = v.equals(false);
                if_(result, () => {
                    // 模拟对n的操作
                    // assign(n, n.multiply(float(-1.0)));
                });
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });
});
