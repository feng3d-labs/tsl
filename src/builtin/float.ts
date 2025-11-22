import { IElement } from '../IElement';

export class Float implements IElement
{
    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor()
    {
    }
}

export function float()
{
    return new Float();
}