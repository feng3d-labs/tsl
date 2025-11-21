import { attribute, fragment, precision, shader, uniform, vec4, vertex } from '@feng3d/tsl';

export const helloTriangle = shader("helloTriangle", () =>
{
    // precision: 'lowp' | 'mediump' | 'highp' = 'highp';
    precision('highp');

    // Vertex shader 的 attribute
    const position = attribute("position", "vec2", 0);

    // Fragment shader 的 uniform
    const color = uniform("color", "vec4", 0, 0);

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        return vec4(position, 0.0, 1.0);
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        return color;
    });
});