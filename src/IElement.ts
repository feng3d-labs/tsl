export interface IElement
{
    dependencies: IElement[]
    toGLSL(type: 'vertex' | 'fragment'): string;
    toWGSL(type: 'vertex' | 'fragment'): string;
}

/**
 * 着色器值类型接口
 * 表示着色器中的值/表达式，如 vec2, vec3, vec4, mat4 等
 */
export interface ShaderValue extends IElement
{
    glslType: string;
    wgslType: string;
}