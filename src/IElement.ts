export interface IElement
{
    dependencies: IElement[]
    toGLSL(type?: 'vertex' | 'fragment'): string;
    toWGSL(type?: 'vertex' | 'fragment'): string;
}

export interface IType extends IElement
{
    glslType: string;
    wgslType: string;
}