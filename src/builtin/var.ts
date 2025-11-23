import { IElement, IType } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Fragment } from '../Fragment';
import { Struct } from '../struct';
import { Varying } from '../Varying';
import { Builtin } from './builtin';

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
        const dep = value.dependencies[0];
        instance.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            // 对于 Varying，返回变量名而不是声明语句
            if (dep instanceof Varying)
            {
                return dep.name;
            }
            // 对于 Builtin，使用其 toGLSL 方法（如 position 返回 gl_Position）
            if (dep instanceof Builtin)
            {
                return dep.toGLSL();
            }

            // 其他情况使用依赖的 toGLSL
            return dep.toGLSL(type);
        };
        instance.toWGSL = (type: 'vertex' | 'fragment') => `${varName}.${key}`;
        instance.dependencies = [result];

        (result as any)[key] = instance;
    });

    // 收集 var 语句或标记为输入参数
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        // 如果结构体包含 varying 字段，在 fragment shader 中作为函数参数，不生成 var 语句
        // 在 vertex shader 中，无论是否有 varying，都生成 var 语句（作为输出变量）
        const isFragment = currentFunc instanceof Fragment;
        const hasVarying = struct.hasVarying();

        // 只在 fragment shader 中，如果结构体包含 varying，才不生成 var 语句
        // 在 vertex shader 中，始终生成 var 语句
        if (!isFragment || !hasVarying)
        {
            currentFunc.statements.push({
                // GLSL 中不需要输出结构体变量声明
                toGLSL: (type: 'vertex' | 'fragment') => ``,
                toWGSL: (type: 'vertex' | 'fragment') => `var ${varName}: ${struct.structName};`,
            });
        }
        // 收集依赖（用于在 fragment shader 中生成函数参数）
        currentFunc.dependencies.push(result);
    }

    return result as IElement & T;
}