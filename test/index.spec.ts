import { describe, expect, it } from 'vitest';
import {
    generateGLSL,
    generateShaders,
    generateWGSL,
    ShaderConfig,
    FunctionCallConfig,
    UniformConfig,
    MainFunctionConfig,
    AttributeConfig,
} from '../src/index';

describe('index', () =>
{
    it('应该导出所有必要的类型和函数', () =>
    {
        // 验证类型存在
        const config: ShaderConfig = {
            type: 'fragment',
            precision: 'highp',
            uniforms: [
                {
                    name: 'color',
                    type: 'vec4',
                    binding: 0,
                    group: 0,
                } as UniformConfig,
            ],
            main: {
                return: 'color',
            } as MainFunctionConfig,
        };

        expect(generateGLSL).toBeDefined();
        expect(generateWGSL).toBeDefined();
        expect(generateShaders).toBeDefined();

        const result = generateShaders(config);
        expect(result.glsl).toBeTruthy();
        expect(result.wgsl).toBeTruthy();
    });

    it('应该能够使用导出的类型', () =>
    {
        const functionCall: FunctionCallConfig = {
            function: 'vec4',
            args: ['1.0', '0.5', '0.0', '1.0'],
        };

        const uniform: UniformConfig = {
            name: 'color',
            type: 'vec4',
            binding: 0,
            group: 0,
        };

        const attribute: AttributeConfig = {
            name: 'position',
            type: 'vec2',
            location: 0,
        };

        const main: MainFunctionConfig = {
            return: functionCall,
        };

        expect(functionCall.function).toBe('vec4');
        expect(uniform.name).toBe('color');
        expect(attribute.name).toBe('position');
        expect(main.return).toBe(functionCall);
    });
});
