import { let_, return_, attribute, fragment, mat4, precision, shader, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

export const sample2Shader = shader("sample2", () =>
{
    // Vertex shader 的 attribute
    const aVertexPosition = vec2(attribute("aVertexPosition", 0));

    // Vertex shader 的 uniforms
    const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
    const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        const position = let_("position", vec4(aVertexPosition, 0.0, 1.0));

        return_(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        return_(vec4(1.0, 0.0, 1.0, 1.0));
    });
});

