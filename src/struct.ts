import { IElement } from './IElement';

const STRUCT_SYMBOL = Symbol('Struct');

export class Struct implements IElement
{
    readonly __type__ = STRUCT_SYMBOL;

    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    dependencies: IElement[];
    readonly name: string;
    readonly fields: { [key: string]: IElement };

    constructor(name: string, fields: { [key: string]: IElement })
    {
        this.name = name;
        this.fields = fields;

        this.toGLSL = (type: 'vertex' | 'fragment') => `struct ${this.name} { ${Object.entries(this.fields).map(([key, value]) => `${key}: ${value.toGLSL(type)}`).join('; ')} };`;
        this.toWGSL = (type: 'vertex' | 'fragment') => `struct ${this.name} { ${Object.entries(this.fields).map(([key, value]) => `${key}: ${value.toWGSL(type)}`).join('; ')} };`;
        this.dependencies = Object.values(fields);
    }
}

export function struct<T extends { [key: string]: IElement }>(name: string, fields: T): T
{
    return new Struct(name, fields) as unknown as T;
}