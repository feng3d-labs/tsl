import { attribute, fragment, precision, shader, uniform, vec2, vec4, vertex, Expression, _let } from '@feng3d/tsl';
import { FunctionCallConfig } from '@feng3d/tsl';

/**
 * 创建一个 mat4 uniform 的辅助函数
 * 类似于 vec4(uniform(...)) 的用法
 */
function mat4(uniform: any): Expression
{
    const valueConfig: FunctionCallConfig = {
        function: 'mat4',
        args: [uniform.name],
    };

    // 直接更新 uniform 的 value
    uniform.value = valueConfig;

    // 返回 Expression 以支持链式调用
    return new Expression(valueConfig);
}

export const sample2Shader = shader("sample2", () =>
{
    // precision: 'lowp' | 'mediump' | 'highp' = 'highp';
    precision('highp');

    // Vertex shader 的 attribute
    const aVertexPosition = vec2(attribute("aVertexPosition", 0));

    // Vertex shader 的 uniforms
    const uModelViewMatrix = mat4(uniform("uModelViewMatrix", 0, 0));
    const uProjectionMatrix = mat4(uniform("uProjectionMatrix", 1, 0));

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        const position = _let("position", vec4(aVertexPosition, 0.0, 1.0));

        return uProjectionMatrix.multiply(uModelViewMatrix).multiply(position);
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        // gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
        return vec4(1.0, 0.0, 1.0, 1.0);
    });
});

