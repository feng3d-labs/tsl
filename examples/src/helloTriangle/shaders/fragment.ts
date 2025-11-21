import { FragmentShader, fragmentfunc, uniform } from '@feng3d/tsl';

export class fragment extends FragmentShader
{
    color = uniform("color", "vec4", 0, 0);

    main = fragmentfunc("main", () =>
    {
        return this.color;
    });

    
}