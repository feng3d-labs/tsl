import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';

/**
 * Int 类，用于表示整数类型（int/i32）
 */
export class Int implements ShaderValue
{
    readonly glslType = 'int';
    readonly wgslType = 'i32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: number);
    constructor(...args: (number | Uniform | Attribute | Varying)[])
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
            const intValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${intValue}`;
            this.toWGSL = () => `${intValue}`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for Int');
        }
    }
}

/**
 * int 构造函数
 */
export function int(uniform: Uniform): Int;
export function int(attribute: Attribute): Int;
export function int(varying: Varying): Int;
export function int(value: number): Int;
export function int(...args: (number | Uniform | Attribute | Varying)[]): Int
{
    return new (Int as any)(...args);
}

