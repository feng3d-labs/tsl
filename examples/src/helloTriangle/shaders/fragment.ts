import { generateGLSL as generateGLSLFromConfig, generateWGSL as generateWGSLFromConfig, classToShaderConfig } from '@feng3d/tsl';

export class FragmentShader
{
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    uniforms = { color: { type: 'vec4', binding: 0, group: 0 } };

    main()
    {
        return 'color';
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