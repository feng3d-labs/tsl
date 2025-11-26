import { IElement, ShaderValue } from '../IElement';
import { getCurrentFunc } from '../currentFunc';
import { Fragment } from '../Fragment';
import { VaryingStruct } from '../varyingStruct';
import { Varying } from '../Varying';
import { Builtin } from './builtin';
import { Float } from './types/float';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 var 语句）
 * @param name 变量名
 * @param expr 表达式或字面值
 * @returns 设置了变量名的表达式实例
 */
export function var_<T extends { [key: string]: IElement }>(name: string, struct: VaryingStruct<T>): IElement & T;
export function var_<T extends ShaderValue>(name: string, expr: T): T;
export function var_(name: string, expr: number): Float;
export function var_(...args: any[]): any
{
    if (args[1] instanceof VaryingStruct)
    {
        return var_struct(args[0] as string, args[1] as VaryingStruct<any>);
    }
    const name = args[0] as string;
    let expr: ShaderValue;

    // 如果第二个参数是数字，自动转换为 Float
    if (typeof args[1] === 'number')
    {
        expr = new Float(args[1]);
    }
    else
    {
        expr = args[1] as ShaderValue;
    }

    const cls = expr.constructor;
    const result: ShaderValue = new (cls as any)();

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
    else
    {
        // 在函数外部定义，标记为外部变量并保存初始化信息
        (result as any)._isExternalVar = true;
        (result as any)._varName = name;
        (result as any)._varExpr = expr;
    }

    return result;
}

function var_struct<T extends { [key: string]: Builtin | Varying }>(varName: string, struct: VaryingStruct<T>): IElement & T
{
    const result = {
        toGLSL: (type: 'vertex' | 'fragment') => ``,
        toWGSL: (type: 'vertex' | 'fragment') => `${varName}`,
        dependencies: [struct],
    } as IElement as IElement & T;

    Object.entries(struct.fields).forEach(([key, value]) =>
    {
        const dep = value.dependencies[0];
        // 直接使用 value，重写其 toGLSL 和 toWGSL 方法
        const originalToGLSL = value.toGLSL;
        const originalToWGSL = value.toWGSL;

        value.toGLSL = (type: 'vertex' | 'fragment') =>
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

            // 其他情况使用原始的 toGLSL
            return originalToGLSL(type);
        };
        // 对于 WGSL，使用变量名（Builtin.name 或 Varying.name，即结构体字段名）
        const fieldVarName = dep instanceof Builtin ? dep.name! : (dep instanceof Varying ? dep.name! : key);
        value.toWGSL = (type: 'vertex' | 'fragment') => `${varName}.${fieldVarName}`;
        value.dependencies = [result];

        (result as any)[key] = value;
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