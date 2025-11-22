export interface IStatement
{
    toGLSL(type?: 'vertex' | 'fragment'): string;
    toWGSL(type?: 'vertex' | 'fragment'): string;
}