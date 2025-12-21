import { Attribute } from '../../attribute';
import { Builtin } from '../builtin';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';

/**
 * Bool 类，用于表示 bool 类型
 * @internal 库外部不应直接使用 `new Bool()`，应使用 `bool()` 函数
 */
export class Bool implements ShaderValue
{
    readonly glslType = 'bool';
    readonly wgslType = 'bool';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: boolean);
    constructor(builtin: Builtin);
    constructor(...args: (boolean | Uniform | Attribute | Varying | Builtin)[])
    {
        if (args.length === 0) return;
        if (args.length === 1 && args[0] instanceof Uniform)
        {
            const uniform = args[0] as Uniform;
            this.dependencies = [uniform];
            this.toGLSL = () => uniform.name;
            this.toWGSL = () => uniform.name;
            uniform.value = this;
        }
        else if (args.length === 1 && args[0] instanceof Attribute)
        {
            const attribute = args[0] as Attribute;
            this.dependencies = [attribute];
            this.toGLSL = () => attribute.name;
            this.toWGSL = () => attribute.name;
            attribute.value = this;
        }
        else if (args.length === 1 && args[0] instanceof Varying)
        {
            const varying = args[0] as Varying;
            this.dependencies = [varying];
            this.toGLSL = () => varying.name;
            this.toWGSL = () => varying.name;
            varying.value = this;
        }
        else if (args.length === 1 && args[0] instanceof Builtin)
        {
            const builtin = args[0] as Builtin;
            this.dependencies = [builtin];
            this.toGLSL = () => builtin.toGLSL();
            // 对于 builtin，在表达式中使用完整变量名（包括结构体前缀）
            this.toWGSL = () => builtin.getFullWGSLVarName();
            builtin.value = this;
        }
        else if (args.length === 1 && typeof args[0] === 'boolean')
        {
            const value = args[0] as boolean;
            this.dependencies = [];
            this.toGLSL = () => value.toString();
            this.toWGSL = () => value.toString();
        }
        else
        {
            throw new Error('Invalid arguments for Bool');
        }
    }

    equals(other: Bool | boolean): Bool
    {
        const result = new Bool();
        const otherIsBool = other instanceof Bool;
        const otherIsBuiltin = other instanceof Builtin;

        result.toGLSL = () => {
            const thisStr = this.toGLSL();
            const otherStr = otherIsBool ? other.toGLSL() : typeof other === 'boolean' ? other.toString() : other;

            return `${thisStr} == ${otherStr}`;
        };

        result.toWGSL = () => {
            const thisStr = this.toWGSL();
            const otherStr = otherIsBool ? other.toWGSL() : typeof other === 'boolean' ? other.toString() : other;

            return `${thisStr} == ${otherStr}`;
        };

        result.dependencies = otherIsBool ? [this, other] : [this];

        return result;
    }
}

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
export function bool(arg?: boolean | Uniform | Attribute | Varying | Builtin): Bool
{
    if (arg === undefined)
    {
        return new Bool();
    }
    // 使用类型保护来明确调用哪个构造函数
    if (typeof arg === 'boolean')
    {
        return new Bool(arg);
    }
    if (arg instanceof Uniform)
    {
        return new Bool(arg);
    }
    if (arg instanceof Attribute)
    {
        return new Bool(arg);
    }
    if (arg instanceof Varying)
    {
        return new Bool(arg);
    }
    if (arg instanceof Builtin)
    {
        return new Bool(arg);
    }

    // 默认情况，应该不会到达这里
    return new Bool();
}
