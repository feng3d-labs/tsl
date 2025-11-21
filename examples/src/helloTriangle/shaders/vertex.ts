import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig, classToShaderConfig, FunctionCallConfig, attribute, func } from '@feng3d/tsl';

export class VertexShader
{
    position = attribute("position", "vec2", 0);

    main = func("main", () =>
    {
        return {
            function: 'vec4',
            args: [String(this.position), '0.0', '1.0'],
        } as FunctionCallConfig;
    });

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

