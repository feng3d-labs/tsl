import { _let, _return, attribute, fragment, mat4, precision, shader, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

export const sample2Shader = shader("sample2", () =>
{
    // precision: 'lowp' | 'mediump' | 'highp' = 'highp';
    // precision('highp');

    // Vertex shader 的 attribute
    const aVertexPosition = vec2(attribute("aVertexPosition", 0));

    // Vertex shader 的 uniforms
    const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
    const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        // const position = _let("position", vec4(aVertexPosition, 0.0, 1.0));

        _return(uProjectionMatrix.multiply(uModelViewMatrix).multiply(vec4(aVertexPosition, 0.0, 1.0)));
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        _return(vec4(1.0, 0.0, 1.0, 1.0));
    });
});

