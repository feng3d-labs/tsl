import { let_, return_, attribute, fragment, mat4, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute（location 缺省时自动分配）
const aVertexPosition = vec2(attribute('aVertexPosition'));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const position = let_('position', vec4(aVertexPosition, 0.0, 1.0));

    return_(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(vec4(1.0, 0.0, 1.0, 1.0));
});

