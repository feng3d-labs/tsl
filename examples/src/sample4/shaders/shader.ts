import { let_, return_, attribute, fragment, mat4, precision, shader, uniform, vec2, vec4, vertex, builtin, assign, var_ } from '@feng3d/tsl';

export const sample4Shader = shader("sample4", () =>
{
    // Vertex shader 的 attributes
    const aVertexPosition = vec2(attribute("aVertexPosition", 0));
    const aVertexColor = vec4(attribute("aVertexColor", 1));

    // Vertex shader 的 uniforms
    const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
    const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));

    const positionBuiltin = vec4(builtin("position", "position_vec4"));

    // struct("VertexOutput", {
    //     position: positionBuiltin,
    // });

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        const position = let_("position", vec4(aVertexPosition, 0.0, 1.0));

        return_(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
        // assign(positionBuiltin, uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
        // assign(vColor, aVertexColor);
    });

    // Fragment shader 入口函数
    // 注意：由于 TSL 目前不支持 varying，这里使用 uniform 传递颜色
    // 在实际应用中，可以通过其他方式传递顶点颜色
    fragment("main", () =>
    {
        precision('lowp');

        // 使用一个固定的颜色，或者可以通过 uniform 传递
        // 这里为了演示，使用白色
        return_(vec4(1.0, 1.0, 1.0, 1.0));
    });
});

