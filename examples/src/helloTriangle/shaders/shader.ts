import { Shader, FunctionCallConfig, attribute, vertexfunc, fragmentfunc, uniform } from '@feng3d/tsl';

export class helloTriangle extends Shader
{
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    // Vertex shader 的 attribute
    position = attribute("position", "vec2", 0);

    // Fragment shader 的 uniform
    color = uniform("color", "vec4", 0, 0);

    // Vertex shader 入口函数
    vertex = vertexfunc("main", () =>
    {
        return {
            function: 'vec4',
            args: [String(this.position), '0.0', '1.0'],
        } as FunctionCallConfig;
    });

    // Fragment shader 入口函数
    fragment = fragmentfunc("main", () =>
    {
        return this.color;
    });
}

