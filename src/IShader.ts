import { Fragment } from "./Fragment";
import { Vertex } from "./Vertex";
import { Attribute } from "./Attribute";
import { Uniform } from "./Uniform";

/**
 * Shader 实例接口（用于自动收集定义）
 * @internal
 */
export interface IShader
{
    /** GLSL 精度声明（仅用于 fragment shader） */
    precision?: 'lowp' | 'mediump' | 'highp';
    /** Vertex 函数字典（以函数名为 key） */
    vertexs: Record<string, Vertex>;
    /** Fragment 函数字典（以函数名为 key） */
    fragments: Record<string, Fragment>;
}
