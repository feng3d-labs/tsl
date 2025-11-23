import { IElement } from './IElement';

const STRUCT_SYMBOL = Symbol('Struct');

export class Struct<T extends { [key: string]: IElement }> implements IElement
{
    readonly __type__ = STRUCT_SYMBOL;
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    dependencies: IElement[];

    constructor(varName: string, structType: StructType<T>)
    {
        this.toGLSL = (type: 'vertex' | 'fragment') => `${varName}`;
        this.toWGSL = (type: 'vertex' | 'fragment') => `${varName}`;
        this.dependencies = [structType];
    }
}

export function struct<T extends { [key: string]: IElement }>(varName: string, structType: StructType<T>): (Struct<T> & T)
{
    const result = new Struct(varName, structType) as Struct<T> & T;

    Object.entries(structType.fields).forEach(([key, value]) =>
    {
        const element: IElement = {
            toGLSL: (type: 'vertex' | 'fragment') => `${varName}.${key}`,
            toWGSL: (type: 'vertex' | 'fragment') => `${varName}.${key}`,
            dependencies: [result],
        };

        (result as any)[key] = element;
    });

    return result;
}

const STRUCT_TYPE_SYMBOL = Symbol('StructType');

export class StructType<T extends { [key: string]: IElement }> implements IElement
{
    readonly __type__ = STRUCT_TYPE_SYMBOL;
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

export function structType<T extends { [key: string]: IElement }>(structName: string, fields: T): StructType<T>
{
    return new StructType(structName, fields);
}