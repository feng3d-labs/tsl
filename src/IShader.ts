import { AttributeDef, FragmentFuncDef, UniformDef, VertexFuncDef } from "./shaderHelpers";

/**
 * Shader 实例接口（用于自动收集定义）
 * @internal
 */
export interface IShader
{
    /** GLSL 精度声明（仅用于 fragment shader） */
    precision?: 'lowp' | 'mediump' | 'highp';
    /** Attributes 字典（以变量名为 key） */
    attributes: Record<string, AttributeDef>;
    /** Uniforms 字典（以变量名为 key） */
    uniforms: Record<string, UniformDef>;
    /** Vertex 函数字典（以函数名为 key） */
    vertexs: Record<string, VertexFuncDef>;
    /** Fragment 函数字典（以函数名为 key） */
    fragments: Record<string, FragmentFuncDef>;
}
