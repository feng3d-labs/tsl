export interface IStatement
{
    toGLSL(type: 'vertex' | 'fragment', version?: 1 | 2): string;
    toWGSL(type: 'vertex' | 'fragment'): string;
}