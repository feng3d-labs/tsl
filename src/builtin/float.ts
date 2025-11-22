import { IElement } from '../IElement';

export class Float implements IElement
{
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