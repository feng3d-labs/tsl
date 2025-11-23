import { Builtin } from './builtin/builtin';
import { IElement } from './IElement';

export class Struct<T extends { [key: string]: IElement }> implements IElement
{
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
        this.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            const fieldDefs = Object.entries(this.fields).map(([fieldName, value]) =>
            {
                const builtin = value.dependencies[0] as Builtin;
                // Builtin.toWGSL() 返回格式: @builtin(position) varName: vec4<f32>
                // 我们需要提取 @builtin(...) 和类型，使用结构体字段名
                const builtinWgsl = builtin.toWGSL();
                // 提取 @builtin(...) 部分
                const builtinMatch = builtinWgsl.match(/@builtin\([^)]+\)/);
                const builtinPart = builtinMatch ? builtinMatch[0] : '';
                // 提取类型部分（在冒号之后）
                const typeMatch = builtinWgsl.match(/:\s*([^;]+)/);
                const typePart = typeMatch ? typeMatch[1].trim() : builtin.value?.wgslType || '';

                return `${builtinPart} ${fieldName}: ${typePart}`;
            });
            return `struct ${this.structName} { ${fieldDefs.join('; ')} }`;
        };
        this.dependencies = Object.values(this.fields);
    }
}

export function struct<T extends { [key: string]: IElement }>(structName: string, fields: T): Struct<T>
{
    return new Struct(structName, fields);
}