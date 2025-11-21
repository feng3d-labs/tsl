export interface IElement
{
    dependencies: IElement[]
    toGLSL(): string;
    toWGSL(): string;
}