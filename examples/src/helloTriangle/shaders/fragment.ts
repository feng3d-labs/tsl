import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig, classToShaderConfig, uniform } from '@feng3d/tsl';

export class FragmentShader
{
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    color = uniform("color", "vec4", 0, 0);

    main()
    {
        return this.color;
    }

    /**
     * 生成 GLSL 着色器代码
     */
    generateGLSL(): string
    {
        const config = classToShaderConfig(this, 'fragment');
        return generateGLSLFromConfig(config);
    }

    /**
     * 生成 WGSL 着色器代码
     */
    generateWGSL(): string
    {
        const config = classToShaderConfig(this, 'fragment');
        return generateWGSLFromConfig(config);
    }
}