import { Shader, fragmentfunc, uniform } from '@feng3d/tsl';

export class fragment extends Shader
{
    precision: 'lowp' | 'mediump' | 'highp' = 'highp';

    color = uniform("color", "vec4", 0, 0);

    main = fragmentfunc("main", () =>
    {
        return this.color;
    });
}