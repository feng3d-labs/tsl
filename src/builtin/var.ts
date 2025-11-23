import { IElement, IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Struct } from '../struct';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 var 语句）
 * @param name 变量名
 * @param expr 表达式
 * @returns 设置了变量名的表达式实例
 */
export function var_<T extends { [key: string]: IElement }>(name: string, struct: Struct<T>): IElement & T;
export function var_<T extends IType>(name: string, expr: T): T;
export function var_(...args: any[]): any
{
    if (args[1] instanceof Struct)
    {
        return var_struct(args[0] as string, args[1] as Struct<any>);
    }
    const name = args[0] as string;
    const expr = args[1] as IType;

    const cls = expr.constructor;
    const result: IType = new (cls as any)();

    result.toGLSL = (type: 'vertex' | 'fragment') => `${name}`;
    result.toWGSL = (type: 'vertex' | 'fragment') => `${name}`;
    result.dependencies = [expr];

    // 收集 var 语句
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            toGLSL: (type: 'vertex' | 'fragment') => `${expr.glslType} ${name} = ${expr.toGLSL(type)};`,
            toWGSL: (type: 'vertex' | 'fragment') => `var ${name} = ${expr.toWGSL(type)};`,
        });
        // 收集依赖
        currentFunc.dependencies.push(result);
    }

    return result;
}

function var_struct<T extends { [key: string]: IElement }>(varName: string, struct: Struct<T>): IElement & T
{
    const result = {
        toGLSL: (type: 'vertex' | 'fragment') => ``,
        toWGSL: (type: 'vertex' | 'fragment') => `${varName}`,
        dependencies: [struct],
    } as IElement as IElement & T;

    Object.entries(struct.fields).forEach(([key, value]) =>
    {
        const cls = value.constructor as new () => IElement;
        const instance = new cls();
        instance.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            return value.dependencies[0].toGLSL(type)
        };
        instance.toWGSL = (type: 'vertex' | 'fragment') => `${varName}.${key}`;
        instance.dependencies = [result];

        (result as any)[key] = instance;
    });

    // 收集 var 语句
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        currentFunc.statements.push({
            // GLSL 中不需要输出结构体变量声明
            toGLSL: (type: 'vertex' | 'fragment') => ``,
            toWGSL: (type: 'vertex' | 'fragment') => `var ${varName}: ${struct.structName};`,
        });
        // 收集依赖
        currentFunc.dependencies.push(result);
    }

    return result as IElement & T;
}