import { Shader } from './Shader';

/**
 * Fragment Shader 基类
 * 提供 precision 属性和代码生成方法
 */
export class FragmentShader extends Shader
{
    /**
     * GLSL 精度声明
     */
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    readonly type = 'fragment';
}

