import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { bool } from '../../../src/builtin/types/bool';
import { builtin } from '../../../src/builtin/builtin';
import { varyingStruct } from '../../../src/varyingStruct';
import { vec3 } from '../../../src/builtin/types/vec3';
import { equals_ } from '../../../src/builtin/equals_';
import { if_ } from '../../../src/builtin/if_';
import { vertex } from '../../../src/vertex';
import { fragment } from '../../../src/fragment';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

// 预先定义mock，解决提升问题
vi.mock('../../../src/currentFunc', () => ({
    getCurrentFunc: () => currentFunc,
}));

vi.mock('../../../src/ifStack', () => ({
    pushIfStatement: () => {},
    popIfStatement: () => {},
    getCurrentIfStatement: () => null,
}));

// 使用内联定义的方式解决MockIfStatement未定义问题
vi.mock('../../../src/builtin/if_', async () => {
    // 导入实际的模块
    const actual = await vi.importActual('../../../src/builtin/if_') as any;
    
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

describe('Bool', () => {
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
    
    describe('bool() 函数创建的实例', () => {
        it('应该能够创建 Bool 实例', () => {
            const b = bool(true);
            expect(b.glslType).toBe('bool');
            expect(b.wgslType).toBe('bool');
            expect(b.toGLSL()).toBe('true');
            expect(b.toWGSL()).toBe('true');
        });
        
        it('应该能够创建 bool builtin 实例', () => {
            const b = bool(builtin('gl_FrontFacing'));
            expect(b.glslType).toBe('bool');
            expect(b.wgslType).toBe('bool');
            
            // 测试varyingStruct中的使用
            const struct = varyingStruct({
                gl_FrontFacing: b,
            });
            const v = struct.fields.gl_FrontFacing;
            expect(v.dependencies.length).toBeGreaterThan(0);
        });
    });
    
    describe('toGLSL', () => {
        it('应该生成正确的 gl_FrontFacing GLSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            expect(v.toGLSL()).toBe('gl_FrontFacing');
        });
        
        it('应该生成正确的 bool 字面量 GLSL 代码', () => {
            const b = bool(true);
            expect(b.toGLSL()).toBe('true');
            
            const b2 = bool(false);
            expect(b2.toGLSL()).toBe('false');
        });
    });
    
    describe('toWGSL', () => {
        it('应该生成正确的 front_facing WGSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            expect(v.toWGSL()).toBe('v.gl_FrontFacing');
        });
        
        it('应该生成正确的 bool 字面量 WGSL 代码', () => {
            const b = bool(true);
            expect(b.toWGSL()).toBe('true');
            
            const b2 = bool(false);
            expect(b2.toWGSL()).toBe('false');
        });
    });
    
    describe('equals_ 函数', () => {
        it('应该生成正确的 bool 比较 GLSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = equals_(v, false);
            
            expect(result.toGLSL()).toBe('gl_FrontFacing == false');
            expect(result.toWGSL()).toBe('v.gl_FrontFacing == false');
        });
        
        it('应该返回 Bool 类型', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = equals_(v, false);
            
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });
    
    describe('if_ 函数', () => {
        it('应该能够使用 bool 条件', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = equals_(v, false);
            
            // 执行if_函数
            if_(result, () => {});
            
            // 检查条件是否被正确添加到dependencies
            expect(currentFunc.dependencies).toContain(result);
        });
        
        it('应该能够在顶点着色器中使用', () => {
            const v = bool(builtin('gl_FrontFacing'));
            
            // 创建顶点着色器
            const vShader = vertex('main', () => {
                const result = equals_(v, false);
                if_(result, () => {});
            });
            
            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });
        
        it('应该能够在片段着色器中使用', () => {
            const v = bool(builtin('gl_FrontFacing'));
            
            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = equals_(v, false);
                if_(result, () => {});
            });
            
            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });
    
    describe('gl_FrontFacing builtin', () => {
        it('应该能够创建 gl_FrontFacing builtin', () => {
            const b = builtin('gl_FrontFacing');
            expect(b.builtinName).toBe('gl_FrontFacing');
        });
        
        it('gl_FrontFacing 应该生成正确的 GLSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            expect(v.toGLSL()).toBe('gl_FrontFacing');
        });
        
        it('gl_FrontFacing 应该生成正确的 WGSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            expect(v.toWGSL()).toBe('v.gl_FrontFacing');
        });
    });
    
    describe('bool 类型与其他类型的交互', () => {
        it('应该能够与 vec3 类型一起使用', () => {
            const v = bool(builtin('gl_FrontFacing'));
            const n = vec3(1.0, 2.0, 3.0);
            
            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = equals_(v, false);
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
