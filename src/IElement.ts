export interface IElement
{
    dependencies: IElement[]
    toGLSL(): string;
    toWGSL(): string;
}

export interface IType extends IElement
{
    glslType: string;
    wgslType: string;
}