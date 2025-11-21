import { classToShaderConfig } from './classToShader';
import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig } from './shaderGenerator';

/**
 * Shader 基类
 * 提供通用的代码生成方法
 */
export abstract class Shader
{
    /**
     * 着色器类型
     */
    readonly type: 'vertex' | 'fragment';

    /**
     * 生成 GLSL 着色器代码
     */
    generateGLSL(entry: string = 'main'): string
    {
        const config = classToShaderConfig(this as any, this.type);
        return generateGLSLFromConfig(config);
    }

    /**
     * 生成 WGSL 着色器代码
     */
    generateWGSL(entry: string = 'main'): string
    {
        const config = classToShaderConfig(this as any, this.type);
        return generateWGSLFromConfig(config);
    }
}


