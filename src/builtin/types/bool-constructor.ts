import { Builtin } from '../builtin';
import { Uniform } from '../../uniform';
import { Attribute } from '../../attribute';
import { Varying } from '../../varying';
import { Bool } from './bool';

/**
 * bool 构造函数
 * 如果传入单个 Uniform、Attribute 或 Varying 实例，则将类型信息保存到对应的 value 属性
 */
export function bool(): Bool;
export function bool(uniform: Uniform): Bool;
export function bool(attribute: Attribute): Bool;
export function bool(varying: Varying): Bool;
export function bool(value: boolean): Bool;
export function bool(builtin: Builtin): Bool;
export function bool(...args: (boolean | Uniform | Attribute | Varying | Builtin)[]): Bool
{
    if (args.length === 0) return new Bool();
    
    if (args.length === 1)
    {
        const arg = args[0];
        return new Bool(arg as boolean | Uniform | Attribute | Varying | Builtin);
    }
    
    throw new Error('Invalid arguments for bool');
}
