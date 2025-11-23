import { IElement } from './IElement';

const STRUCT_SYMBOL = Symbol('Struct');

export class Struct implements IElement
{
    readonly __type__ = STRUCT_SYMBOL;

    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    dependencies: IElement[];

    constructor(varName: string, structType: StructType)
    {
        this.toGLSL = (type: 'vertex' | 'fragment') => `${varName}`;
        this.toWGSL = (type: 'vertex' | 'fragment') => `${varName}`;
        this.dependencies = [structType];
    }
}

export function struct(varName: string, structType: StructType): Struct
{
    return new Struct(varName, structType);
}

const STRUCT_TYPE_SYMBOL = Symbol('StructType');

export class StructType implements IElement
{
    readonly __type__ = STRUCT_TYPE_SYMBOL;
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(public readonly structName: string, public readonly fields: { [key: string]: IElement })
    {
        this.toGLSL = (type: 'vertex' | 'fragment') => ``;
        this.toWGSL = (type: 'vertex' | 'fragment') => `struct ${this.structName} { ${Object.entries(this.fields).map(([key, value]) => `${value.dependencies[0].toWGSL(type)}`).join('; ')} }`;
        this.dependencies = Object.values(this.fields);
    }
}

export function structType(structName: string, fields: { [key: string]: IElement })
{
    return new StructType(structName, fields);
}