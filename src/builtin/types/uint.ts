import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { Float } from './float';
import { formatOperand } from '../expressionUtils';
import { formatNumber } from '../formatNumber';

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
    constructor(value: number);
    constructor(other: IElement);
    constructor(...args: (number | Uniform | Attribute | Varying | IElement)[])
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
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            const uintValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${uintValue}u`;
            this.toWGSL = () => `${uintValue}`;
            this.dependencies = [];
        }
        else if (args.length === 1 && typeof args[0] === 'object')
        {
            // 类型转换，将其他类型转换为uint
            const other = args[0] as IElement;
            this.dependencies = [other];
            this.toGLSL = () => `uint(${other.toGLSL()})`;
            this.toWGSL = () => `u32(${other.toWGSL()})`;
        }
        else
        {
            throw new Error('Invalid arguments for UInt');
        }
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
                ? `${Math.floor(other)}` 
                : formatOperand(other, '%', false, () => other.toWGSL());

            return `${left} % ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }
}

/**
 * uint 构造函数
 */
export function uint(uniform: Uniform): UInt;
export function uint(attribute: Attribute): UInt;
export function uint(varying: Varying): UInt;
export function uint(value: number): UInt;
export function uint(other: IElement): UInt;
export function uint(...args: (number | Uniform | Attribute | Varying | IElement)[]): UInt
{
    return new (UInt as any)(...args);
}
