import { attribute, fragment, precision, return_, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute
const aposition = vec2(attribute("position", 0));

// Fragment shader 的 uniform
const color = vec4(uniform("color", 0));

// Vertex shader 入口函数
export const vertexShader = vertex("main", () =>
{
    return_(vec4(aposition, 0.0, 1.0));
});

// Fragment shader 入口函数
export const fragmentShader = fragment("main", () =>
{
    precision('highp');

    return_(color);
});
