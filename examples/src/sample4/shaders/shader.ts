import { assign, attribute, builtin, fragment, mat4, return_, uniform, var_, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes（location 缺省时自动分配）
const aVertexPosition = vec2(attribute("aVertexPosition"));
const aVertexColor = vec4(attribute("aVertexColor"));

// Vertex shader 的 uniforms（group 缺省时使用默认值 0）
const uModelViewMatrix = mat4(uniform("uModelViewMatrix"));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix"));

const vPosition = vec4(builtin("position", "position_vec4"));
const vColor = vec4(varying("vColor", 0));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const position = var_("position", vec4(aVertexPosition, 0.0, 1.0));

    assign(vPosition, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(vColor, aVertexColor);
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    return_(vColor);
});
