import { AttributeDef, FragmentFuncDef, UniformDef, VertexFuncDef } from "./shaderHelpers";

/**
 * Shader 实例接口（用于自动收集定义）
 * @internal
 */
export interface IShader
{
    /** GLSL 精度声明（仅用于 fragment shader） */
    precision?: 'lowp' | 'mediump' | 'highp';
    /** 添加 uniform 定义 */
    _addUniform(def: UniformDef): void;
    /** 添加 attribute 定义 */
    _addAttribute(def: AttributeDef): void;
    /** 添加 vertex 函数定义 */
    _addVertex(def: VertexFuncDef): void;
    /** 添加 fragment 函数定义 */
    _addFragment(def: FragmentFuncDef): void;
    /** 支持动态属性赋值 */
    [key: string]: any;
}
