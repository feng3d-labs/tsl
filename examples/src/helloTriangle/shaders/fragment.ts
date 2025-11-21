import { FragmentShader, func, uniform } from '@feng3d/tsl';

export class fragment extends FragmentShader
{
    color = uniform("color", "vec4", 0, 0);

    main = func("main", () =>
    {
        return this.color;
    });
}