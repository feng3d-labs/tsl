import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { equals_ } from '../../src/builtin/equals_';
import { bool } from '../../src/builtin/types/bool';
import { builtin } from '../../src/builtin/builtin';
import { varyingStruct } from '../../src/varyingStruct';
import { vec3 } from '../../src/builtin/types/vec3';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

describe('equals_', () => {
    beforeEach(() => {
        // 重置currentFunc
        currentFunc = {
            statements: [],
            dependencies: [],
        };
        
        // 使用vitest.mock来模拟模块
        vi.mock('../../src/currentFunc', () => ({
            getCurrentFunc: () => currentFunc,
        }));
    });
    
    afterEach(() => {
        // 清除所有模拟
        vi.clearAllMocks();
    });
    
    describe('equals_ 函数', () => {
        it('应该生成正确的 bool 比较 GLSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = equals_(v, false);
            
            expect(result.toGLSL()).toBe('gl_FrontFacing == false');
            expect(result.toWGSL()).toBe('gl_FrontFacing == false');
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
        
        it('应该能够比较两个布尔值', () => {
            const b1 = bool(true);
            const b2 = bool(false);
            const result = equals_(b1, b2);
            
            expect(result.toGLSL()).toBe('true == false');
            expect(result.toWGSL()).toBe('true == false');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
        
        it('应该能够比较布尔值和布尔字面量', () => {
            const b = bool(true);
            const result = equals_(b, true);
            
            expect(result.toGLSL()).toBe('true == true');
            expect(result.toWGSL()).toBe('true == true');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
        
        it('应该能够比较数值类型', () => {
            const v1 = vec3(1.0, 2.0, 3.0);
            const v2 = vec3(1.0, 2.0, 3.0);
            const result = equals_(v1, v2);
            
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });
});
