import { assign, attribute, builtin, fragment, mat4, precision, return_, struct, uniform, var_, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const aVertexPosition = vec2(attribute("aVertexPosition", 0));
const aVertexColor = vec4(attribute("aVertexColor", 1));

// Vertex shader 的 uniforms
const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));

// const VertexOutput = struct("VertexOutput", {
//     position: vec4(builtin("position", "position_vec4")),
//     color: vec4(varying("vColor", 0)),
// });

// // Vertex shader 入口函数
// export const vertexShader = vertex("main", () =>
// {
//     const output = var_('output', VertexOutput);
//     const position = var_("position", vec4(aVertexPosition, 0.0, 1.0));

//     assign(output.position, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
//     assign(output.color, aVertexColor);
//     return_(output as any);
// });

// // Fragment shader 入口函数
// export const fragmentShader = fragment("main", () =>
// {
//     precision('lowp');
//     const input = var_('input', VertexOutput);

//     return_(input.color);
// });

const Varying = struct("Varying", {
    position1: vec4(builtin("position", "position_vec4")),
    color: vec4(varying("vColor", 0)),
});

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    const output = var_('v', Varying);
    const position = var_("position", vec4(aVertexPosition, 0.0, 1.0));

    assign(output.position1, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    assign(output.color, aVertexColor);
    return_(output as any);
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    precision('lowp');
    const input = var_('v', Varying);

    return_(input.color);
});

