import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { bool } from '../../src/builtin/types/bool';
import { builtin } from '../../src/builtin/builtin';
import { varyingStruct } from '../../src/varyingStruct';
import { vec3 } from '../../src/builtin/types/vec3';
import { float } from '../../src/builtin/types/float';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

describe('equals method', () => {
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
    
    describe('Bool.equals 方法', () => {
        it('应该生成正确的 bool 比较 GLSL 代码', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = v.equals(false);
            
            expect(result.toGLSL()).toBe('gl_FrontFacing == false');
            expect(result.toWGSL()).toBe('v.gl_FrontFacing == false');
        });
        
        it('应该返回 Bool 类型', () => {
            const struct = varyingStruct({
                gl_FrontFacing: bool(builtin('gl_FrontFacing')),
            });
            const v = struct.fields.gl_FrontFacing;
            const result = v.equals(false);
            
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
        
        it('应该能够比较两个布尔值', () => {
            const b1 = bool(true);
            const b2 = bool(false);
            const result = b1.equals(b2);
            
            expect(result.toGLSL()).toBe('true == false');
            expect(result.toWGSL()).toBe('true == false');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
        
        it('应该能够比较布尔值和布尔字面量', () => {
            const b = bool(true);
            const result = b.equals(true);
            
            expect(result.toGLSL()).toBe('true == true');
            expect(result.toWGSL()).toBe('true == true');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });
    
    describe('Float.equals 方法', () => {
        it('应该能够比较两个 Float 值', () => {
            const f1 = float(1.0);
            const f2 = float(2.0);
            const result = f1.equals(f2);
            
            expect(result.toGLSL()).toBe('1.0 == 2.0');
            expect(result.toWGSL()).toBe('1.0 == 2.0');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
        
        it('应该能够比较 Float 值和数字字面量', () => {
            const f = float(1.0);
            const result = f.equals(1.0);
            
            expect(result.toGLSL()).toBe('1.0 == 1.0');
            expect(result.toWGSL()).toBe('1.0 == 1.0');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });
});
