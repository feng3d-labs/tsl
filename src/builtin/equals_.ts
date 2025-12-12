import { IElement } from '../IElement';
import { Float } from './types/float';
import { Builtin } from './builtin';
import { Bool } from './types/bool';

/**
 * equals_ 函数，用于比较两个值是否相等
 * @param a 第一个比较值
 * @param b 第二个比较值
 * @returns 比较结果的Float对象
 */
export function equals_(a: Float | Bool | number | boolean | Builtin, b: Float | Bool | number | boolean | Builtin): Float
{
    const result = new Float();
    
    // 处理布尔值，转换为数字
    const convertToNumber = (value: any): number | undefined => {
        if (typeof value === 'boolean') {
            return value ? 1.0 : 0.0;
        }
        return undefined;
    };
    
    // 处理a是Builtin类型的情况
    const aIsBuiltin = a instanceof Builtin;
    const bIsBuiltin = b instanceof Builtin;
    
    // 处理a是Bool类型的情况
    const aIsBool = a instanceof Bool;
    const bIsBool = b instanceof Bool;
    
    // 检查是否是布尔值
    const aAsNumber = convertToNumber(a);
    const bAsNumber = convertToNumber(b);
    
    if (typeof a === 'number' && typeof b === 'number')
    {
        // 两个都是数字字面量，直接比较
        const isEqual = a === b;
        result.toGLSL = () => isEqual ? '1.0' : '0.0';
        result.toWGSL = () => isEqual ? '1.0' : '0.0';
        result.dependencies = [];
    }
    else if (typeof a === 'number' || aAsNumber !== undefined)
    {
        // 第一个是数字字面量或布尔值，第二个是Float、Bool或Builtin对象
        const aNum = aAsNumber !== undefined ? aAsNumber : a as number;
        const bStr = aIsBool ? (b as Bool).toGLSL() : bIsBuiltin ? (b as Builtin).toGLSL() : (b as Float).toGLSL();
        const bWGSLStr = aIsBool ? (b as Bool).toWGSL() : bIsBuiltin ? (b as Builtin).toWGSL() : (b as Float).toWGSL();
        result.toGLSL = () => `float(${aNum} == ${bStr})`;
        result.toWGSL = () => `float(${aNum} == ${bWGSLStr})`;
        result.dependencies = [b as IElement];
    }
    else if (typeof b === 'number' || bAsNumber !== undefined)
    {
        // 第二个是数字字面量或布尔值，第一个是Float、Bool或Builtin对象
        const bNum = bAsNumber !== undefined ? bAsNumber : b as number;
        const aStr = aIsBool ? (a as Bool).toGLSL() : aIsBuiltin ? (a as Builtin).toGLSL() : (a as Float).toGLSL();
        const aWGSLStr = aIsBool ? (a as Bool).toWGSL() : aIsBuiltin ? (a as Builtin).toWGSL() : (a as Float).toWGSL();
        result.toGLSL = () => `float(${aStr} == ${bNum})`;
        result.toWGSL = () => `float(${aWGSLStr} == ${bNum})`;
        result.dependencies = [a as IElement];
    }
    else
    {
        // 两个都是非数字对象
        const aStr = aIsBool ? (a as Bool).toGLSL() : aIsBuiltin ? (a as Builtin).toGLSL() : (a as Float).toGLSL();
        const bStr = bIsBool ? (b as Bool).toGLSL() : bIsBuiltin ? (b as Builtin).toGLSL() : (b as Float).toGLSL();
        const aWGSLStr = aIsBool ? (a as Bool).toWGSL() : aIsBuiltin ? (a as Builtin).toWGSL() : (a as Float).toWGSL();
        const bWGSLStr = bIsBool ? (b as Bool).toWGSL() : bIsBuiltin ? (b as Builtin).toWGSL() : (b as Float).toWGSL();
        result.toGLSL = () => `float(${aStr} == ${bStr})`;
        result.toWGSL = () => `float(${aWGSLStr} == ${bWGSLStr})`;
        result.dependencies = [a as IElement, b as IElement];
    }
    
    return result;
}
