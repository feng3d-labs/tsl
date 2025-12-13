import { IElement } from '../IElement';
import { Float } from './types/float';
import { Builtin } from './builtin';
import { Bool } from './types/bool';

/**
 * equals_ 函数，用于比较两个值是否相等
 * @param a 第一个比较值
 * @param b 第二个比较值
 * @returns 比较结果的Bool对象
 */
export function equals_(a: Float | number, b: Float | number): Bool;
export function equals_(a: Bool | boolean, b: Bool | boolean): Bool;
export function equals_(a: Float | Bool | number | boolean, b: Float | Bool | number | boolean): Bool
{
    const result = new Bool();

    // 处理a是Builtin类型的情况
    const aIsBuiltin = a instanceof Builtin;
    const bIsBuiltin = b instanceof Builtin;
    
    // 处理a是Bool类型的情况
    const aIsBool = a instanceof Bool;
    const bIsBool = b instanceof Bool;
    
    // 处理布尔值比较
    const isBooleanComparison = aIsBool || bIsBool || typeof a === 'boolean' || typeof b === 'boolean';
    
    if (isBooleanComparison)
    {
        // 处理布尔值比较
        // 生成布尔比较代码
        result.toGLSL = () => {
            let aStr: string;
            let bStr: string;
            
            // 获取a的GLSL字符串表示
            if (aIsBool)
            {
                aStr = (a as Bool).toGLSL();
            }
            else if (typeof a === 'boolean')
            {
                aStr = a ? 'true' : 'false';
            }
            else if (aIsBuiltin)
            {
                aStr = (a as Builtin).toGLSL();
            }
            else
            {
                aStr = (a as Float).toGLSL();
            }
            
            // 获取b的GLSL字符串表示
            if (bIsBool)
            {
                bStr = (b as Bool).toGLSL();
            }
            else if (typeof b === 'boolean')
            {
                bStr = b ? 'true' : 'false';
            }
            else if (bIsBuiltin)
            {
                bStr = (b as Builtin).toGLSL();
            }
            else
            {
                bStr = (b as Float).toGLSL();
            }
            
            return `${aStr} == ${bStr}`;
        };
        
        result.toWGSL = () => {
            let aStr: string;
            let bStr: string;
            
            // 获取a的WGSL字符串表示
            if (aIsBool)
            {
                aStr = (a as Bool).toWGSL();
            }
            else if (typeof a === 'boolean')
            {
                aStr = a ? 'true' : 'false';
            }
            else if (aIsBuiltin)
            {
                aStr = (a as Builtin).toWGSL();
            }
            else
            {
                aStr = (a as Float).toWGSL();
            }
            
            // 获取b的WGSL字符串表示
            if (bIsBool)
            {
                bStr = (b as Bool).toWGSL();
            }
            else if (typeof b === 'boolean')
            {
                bStr = b ? 'true' : 'false';
            }
            else if (bIsBuiltin)
            {
                bStr = (b as Builtin).toWGSL();
            }
            else
            {
                bStr = (b as Float).toWGSL();
            }
            
            return `${aStr} == ${bStr}`;
        };
        
        result.dependencies = [...(aIsBool || aIsBuiltin ? [a as IElement] : []), ...(bIsBool || bIsBuiltin ? [b as IElement] : [])];
    }
    else if (typeof a === 'number' && typeof b === 'number')
    {
        // 两个都是数字字面量，直接比较
        const isEqual = a === b;
        result.toGLSL = () => isEqual ? 'true' : 'false';
        result.toWGSL = () => isEqual ? 'true' : 'false';
        result.dependencies = [];
    }
    else if (typeof a === 'number')
    {
        // 第一个是数字字面量，第二个是Float或Builtin对象
        const aNum = a as number;
        result.toGLSL = () => {
            const bStr = bIsBuiltin ? (b as Builtin).toGLSL() : (b as Float).toGLSL();
            return `${aNum} == ${bStr}`;
        };
        result.toWGSL = () => {
            const bWGSLStr = bIsBuiltin ? (b as Builtin).toWGSL() : (b as Float).toWGSL();
            return `${aNum} == ${bWGSLStr}`;
        };
        result.dependencies = [b as IElement];
    }
    else if (typeof b === 'number')
    {
        // 第二个是数字字面量，第一个是Float或Builtin对象
        const bNum = b as number;
        result.toGLSL = () => {
            const aStr = aIsBuiltin ? (a as Builtin).toGLSL() : (a as Float).toGLSL();
            return `${aStr} == ${bNum}`;
        };
        result.toWGSL = () => {
            const aWGSLStr = aIsBuiltin ? (a as Builtin).toWGSL() : (a as Float).toWGSL();
            return `${aWGSLStr} == ${bNum}`;
        };
        result.dependencies = [a as IElement];
    }
    else
    {
        // 两个都是非数字对象
        result.toGLSL = () => {
            const aStr = aIsBuiltin ? (a as Builtin).toGLSL() : (a as Float).toGLSL();
            const bStr = bIsBuiltin ? (b as Builtin).toGLSL() : (b as Float).toGLSL();
            return `${aStr} == ${bStr}`;
        };
        result.toWGSL = () => {
            const aWGSLStr = aIsBuiltin ? (a as Builtin).toWGSL() : (a as Float).toWGSL();
            const bWGSLStr = bIsBuiltin ? (b as Builtin).toWGSL() : (b as Float).toWGSL();
            return `${aWGSLStr} == ${bWGSLStr}`;
        };
        result.dependencies = [a as IElement, b as IElement];
    }
    
    return result;
}
