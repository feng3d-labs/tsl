import { Fragment } from './Fragment';
import { Vertex } from './Vertex';

/**
 * Shader 实例接口（用于自动收集定义）
 * @internal
 */
export interface IShader
{
    /** Vertex 函数字典（以函数名为 key） */
    vertexs: Record<string, Vertex>;
    /** Fragment 函数字典（以函数名为 key） */
    fragments: Record<string, Fragment>;
}
