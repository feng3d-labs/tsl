import { Shader, FunctionCallConfig, attribute, vertexfunc } from '@feng3d/tsl';

export class vertex extends Shader
{
    position = attribute("position", "vec2", 0);

    main = vertexfunc("main", () =>
    {
        return {
            function: 'vec4',
            args: [String(this.position), '0.0', '1.0'],
        } as FunctionCallConfig;
    });
}

