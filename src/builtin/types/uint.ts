import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { Builtin } from '../builtin';
import { formatOperand } from '../expressionUtils';
import { Bool } from './bool';

/**
 * UInt 类，用于表示无符号整数类型（uint/u32）
 * @internal 库外部不应直接使用 `new UInt()`，应使用 `uint()` 函数
 */
export class UInt implements ShaderValue
{
    readonly glslType = 'uint';
    readonly wgslType = 'u32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(builtin: Builtin);
    constructor(value: number);
    constructor(other: IElement);
    constructor(...args: (number | Uniform | Attribute | Varying | Builtin | IElement)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于 var_ 函数创建新实例
            return;
        }
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
            // gl_VertexID 在 GLSL 中是 int 类型，需要转换为 uint
            this.toGLSL = () => `uint(${builtin.toGLSL()})`;
            this.toWGSL = () => builtin.getFullWGSLVarName();
            builtin.value = this;
        }
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            const uintValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${uintValue}u`;
            this.toWGSL = () => `${uintValue}u`;
            this.dependencies = [];
        }
        else if (args.length === 1 && typeof args[0] === 'object')
        {
            const other = args[0] as IElement;
            this.dependencies = [other];

            // 检查是否是Builtin对象，如果是，不需要添加uint()包装
            if ('builtinName' in other) {
                // 对于builtin变量，直接使用其名称，不需要类型转换
                this.toGLSL = () => other.toGLSL();
                this.toWGSL = () => other.toWGSL();
            } else {
                // 类型转换，将其他类型转换为uint
                this.toGLSL = () => `uint(${other.toGLSL()})`;
                this.toWGSL = () => `u32(${other.toWGSL()})`;
            }
        }
        else
        {
            throw new Error('Invalid arguments for UInt');
        }
    }

    divide(other: number): UInt
    {
        const result = new UInt();
        result.toGLSL = () => `${this.toGLSL()} / ${Math.floor(other)}u`;
        result.toWGSL = () => `${this.toWGSL()} / ${Math.floor(other)}u`;
        result.dependencies = [this];

        return result;
    }

    /**
     * 取模运算
     */
    mod(other: UInt | number): UInt
    {
        const result = new UInt();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toGLSL());
            const right = typeof other === 'number'
                ? `${Math.floor(other)}u`
                : formatOperand(other, '%', false, () => other.toGLSL());

            return `${left} % ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toWGSL());
            const right = typeof other === 'number'
                ? `${Math.floor(other)}u`
                : formatOperand(other, '%', false, () => other.toWGSL());

            return `${left} % ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 等于比较
     */
    equals(other: UInt | number): Bool
    {
        const result = new Bool();
        if (typeof other === 'number')
        {
            const uintValue = Math.floor(other);
            result.toGLSL = () => `(${this.toGLSL()} == ${uintValue}u)`;
            result.toWGSL = () => `(${this.toWGSL()} == ${uintValue}u)`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `(${this.toGLSL()} == ${other.toGLSL()})`;
            result.toWGSL = () => `(${this.toWGSL()} == ${other.toWGSL()})`;
            result.dependencies = [this, other];
        }

        return result;
    }
}

/**
 * uint 构造函数
 */
export function uint(uniform: Uniform): UInt;
export function uint(attribute: Attribute): UInt;
export function uint(varying: Varying): UInt;
export function uint(builtin: Builtin): UInt;
export function uint(value: number): UInt;
export function uint(other: IElement): UInt;
export function uint(...args: (number | Uniform | Attribute | Varying | Builtin | IElement)[]): UInt
{
    return new (UInt as any)(...args);
}
