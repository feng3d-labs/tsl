import { IElement, ShaderValue } from '../../IElement';

export class Float implements ShaderValue
{
    readonly glslType = 'float';
    readonly wgslType = 'f32';

    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;
    dependencies: IElement[];

    constructor()
    {
    }
}

export function float()
{
    return new Float();
}