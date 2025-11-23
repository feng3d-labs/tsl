import { IElement } from './IElement';

const STRUCT_SYMBOL = Symbol('Struct');

export class Struct<T extends { [key: string]: IElement }> implements IElement
{
    readonly __type__ = STRUCT_SYMBOL;
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(public readonly structName: string, public readonly fields: T)
    {
        this.toGLSL = (type: 'vertex' | 'fragment') => ``;
        this.toWGSL = (type: 'vertex' | 'fragment') => `struct ${this.structName} { ${Object.entries(this.fields).map(([key, value]) => `${value.dependencies[0].toWGSL(type)}`).join('; ')} }`;
        this.dependencies = Object.values(this.fields);
    }
}

export function struct<T extends { [key: string]: IElement }>(structName: string, fields: T): Struct<T>
{
    return new Struct(structName, fields);
}