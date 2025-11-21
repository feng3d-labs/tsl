import { attribute, fragment, precision, shader, uniform, vec2, vec4, vertex, FunctionCallConfig, Uniform } from '@feng3d/tsl';

/**
 * 创建一个 mat4 uniform 的辅助函数
 * 类似于 vec4(uniform(...)) 的用法
 */
function mat4(uniform: Uniform): FunctionCallConfig
{
    const valueConfig: FunctionCallConfig = {
        function: 'mat4',
        args: [uniform.name],
    };

    // 直接更新 uniform 的 value
    uniform.value = valueConfig;

    return valueConfig;
}

export const sample2Shader = shader("sample2", () =>
{
    // precision: 'lowp' | 'mediump' | 'highp' = 'highp';
    precision('highp');

    // Vertex shader 的 attribute
    const aVertexPosition = vec2(attribute("aVertexPosition", 0));

    // Vertex shader 的 uniforms
    const uModelViewMatrixUniform = uniform("uModelViewMatrix", 0, 0);
    const uProjectionMatrixUniform = uniform("uProjectionMatrix", 1, 0);
    const uModelViewMatrix = mat4(uModelViewMatrixUniform);
    const uProjectionMatrix = mat4(uProjectionMatrixUniform);

    // Vertex shader 入口函数
    vertex("main", () =>
    {
        // gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 0.0, 1.0);
        // 在 GLSL/WGSL 中，矩阵乘法使用 * 操作符
        // 注意：矩阵乘法顺序是从右到左
        // 使用字符串表达式，因为 FunctionCallConfig 不支持操作符
        // 返回字符串表达式
        // 注意：在 GLSL 中，字符串会被处理（移除类型参数），在 WGSL 中直接使用
        return `uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 0.0, 1.0)`;
    });

    // Fragment shader 入口函数
    fragment("main", () =>
    {
        // gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
        return vec4(1.0, 0.0, 1.0, 1.0);
    });
});

