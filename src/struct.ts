import { Builtin } from './builtin/builtin';
import { IElement } from './IElement';
import { Varying } from './Varying';

export class Struct<T extends { [key: string]: IElement }> implements IElement
{
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(public readonly structName: string, public readonly fields: T)
    {
        // 验证所有字段都必须是 builtin 或 varying 类型
        for (const [fieldName, value] of Object.entries(this.fields))
        {
            if (!value.dependencies || value.dependencies.length === 0)
            {
                throw new Error(`结构体 '${this.structName}' 的字段 '${fieldName}' 没有依赖项，无法生成 WGSL 代码。`);
            }

            const dep = value.dependencies[0];
            if (!(dep instanceof Builtin) && !(dep instanceof Varying))
            {
                throw new Error(`结构体 '${this.structName}' 的字段 '${fieldName}' 必须是 builtin 或 varying 类型，当前类型不支持。`);
            }
        }

        this.toGLSL = (type: 'vertex' | 'fragment') => ``;
        this.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            const fieldDefs = Object.entries(this.fields).map(([fieldName, value]) =>
            {
                const dep = value.dependencies[0];
                if (dep instanceof Builtin)
                {
                    // Builtin.toWGSL() 返回格式: @builtin(position) varName: vec4<f32>
                    // 我们需要提取 @builtin(...) 和类型，使用结构体字段名
                    const builtinWgsl = dep.toWGSL();
                    // 提取 @builtin(...) 部分
                    const builtinMatch = builtinWgsl.match(/@builtin\([^)]+\)/);
                    const builtinPart = builtinMatch ? builtinMatch[0] : '';
                    // 提取类型部分（在冒号之后）
                    const typeMatch = builtinWgsl.match(/:\s*([^;]+)/);
                    const typePart = typeMatch ? typeMatch[1].trim() : dep.value?.wgslType || '';

                    return `${builtinPart} ${fieldName}: ${typePart}`;
                }
                else if (dep instanceof Varying)
                {
                    // Varying.toWGSL() 返回格式: @location(1) vColor: vec4<f32>
                    // 直接使用，但替换字段名
                    const varyingWgsl = dep.toWGSL(type);
                    // 提取 @location(...) 部分和类型
                    const locationMatch = varyingWgsl.match(/@location\([^)]+\)/);
                    const locationPart = locationMatch ? locationMatch[0] : '@location(0)';
                    // 提取类型部分（在冒号之后）
                    const typeMatch = varyingWgsl.match(/:\s*([^;]+)/);
                    const typePart = typeMatch ? typeMatch[1].trim() : dep.value?.wgslType || '';

                    return `${locationPart} ${fieldName}: ${typePart}`;
                }
                else
                {
                    throw new Error(`不支持的依赖类型`);
                }
            });
            // 格式化结构体定义，每个字段占一行，使用逗号分隔（所有字段后面都有逗号）
            if (fieldDefs.length === 0)
            {
                return `struct ${this.structName} {}`;
            }
            const formattedFields = fieldDefs.map((field) => `    ${field},`).join('\n');

            return `struct ${this.structName} {\n${formattedFields}\n}`;
        };
        this.dependencies = Object.values(this.fields);
    }
}

export function struct<T extends { [key: string]: IElement }>(structName: string, fields: T): Struct<T>
{
    return new Struct(structName, fields);
}