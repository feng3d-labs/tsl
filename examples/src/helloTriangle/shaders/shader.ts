import { _return, attribute, fragment, precision, shader, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

export const helloTriangle = shader("helloTriangle", () =>
{
    // Vertex shader 的 attribute
    const position = vec2(attribute("position", 0));

    // Fragment shader 的 uniform
    const color = vec4(uniform("color", 0, 0));

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        _return(vec4(position, 0.0, 1.0));
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        precision('highp');

        _return(color);
    });
});