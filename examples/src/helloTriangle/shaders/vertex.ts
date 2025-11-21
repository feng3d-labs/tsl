import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig, classToShaderConfig, FunctionCallConfig } from '@feng3d/tsl';

export class VertexShader
{
    attributes = { position: { type: 'vec2', location: 0 } };

    main()
    {
        return {
            function: 'vec4',
            args: ['position', '0.0', '1.0'],
        } as FunctionCallConfig;
    }

    /**
     * 生成 GLSL 着色器代码
     */
    generateGLSL(): string
    {
        const config = classToShaderConfig(this, 'vertex');
        return generateGLSLFromConfig(config);
    }

    /**
     * 生成 WGSL 着色器代码
     */
    generateWGSL(): string
    {
        const config = classToShaderConfig(this, 'vertex');
        return generateWGSLFromConfig(config);
    }
}

