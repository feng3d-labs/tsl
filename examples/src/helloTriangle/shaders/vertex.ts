import { VertexShader, FunctionCallConfig, attribute, func } from '@feng3d/tsl';

export class vertex extends VertexShader
{
    position = attribute("position", "vec2", 0);

    main = func("main", () =>
    {
        return {
            function: 'vec4',
            args: [String(this.position), '0.0', '1.0'],
        } as FunctionCallConfig;
    });
}

