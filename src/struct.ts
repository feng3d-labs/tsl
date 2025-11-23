import { Builtin } from './builtin/builtin';
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
        // 验证所有字段都必须是 builtin 类型
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            if (!value.dependencies || value.dependencies.length === 0)
            {
                throw new Error(`结构体 '${this.structName}' 的字段 '${fieldName}' 没有依赖项，无法生成 WGSL 代码。`);
            }

            const dep = value.dependencies[0];
            if (!(dep instanceof Builtin))
            {
                throw new Error(`结构体 '${this.structName}' 的字段 '${fieldName}' 必须是 builtin 类型，当前类型不支持。`);
            }
        }

        this.toGLSL = (type: 'vertex' | 'fragment') => ``;
        this.toWGSL = (type: 'vertex' | 'fragment') => `struct ${this.structName} { ${Object.entries(this.fields).map(([key, value]) => `${value.dependencies[0].toWGSL(type)}`).join('; ')} }`;
        this.dependencies = Object.values(this.fields);
    }
}

export function struct<T extends { [key: string]: IElement }>(structName: string, fields: T): Struct<T>
{
    return new Struct(structName, fields);
}