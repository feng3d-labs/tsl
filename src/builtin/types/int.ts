import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { Assign } from '../assign';
import { Builtin } from '../builtin';
import { Bool } from './bool';
import { UInt } from './uint';

/**
 * Int 类，用于表示整数类型（int/i32）
 * @internal 库外部不应直接使用 `new Int()`，应使用 `int()` 函数
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
    constructor(builtin: Builtin);
    constructor(value: number);
    constructor(other: UInt);
    constructor(...args: (number | Uniform | Attribute | Varying | Builtin | UInt)[])
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
            this.toGLSL = () => builtin.toGLSL();
            this.toWGSL = () => builtin.getFullWGSLVarName();
            builtin.value = this;
        }
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            const intValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${intValue}`;
            this.toWGSL = () => `${intValue}`;
            this.dependencies = [];
        }
        else if (args.length === 1 && args[0] instanceof UInt)
        {
            // 从 UInt 转换为 Int
            const other = args[0] as UInt;
            this.dependencies = [other];

            // 检查是否来自 gl_InstanceID builtin（在 GLSL 中本身就是 int 类型）
            const isFromInstanceIDBuiltin = other.dependencies?.some(
                (dep) => dep instanceof Builtin && dep.isInstanceIndex,
            );

            if (isFromInstanceIDBuiltin)
            {
                // gl_InstanceID 在 GLSL 中本身就是 int，不需要转换
                const builtin = other.dependencies.find((dep) => dep instanceof Builtin) as Builtin;
                this.toGLSL = () => builtin.toGLSL();
                this.toWGSL = () => `i32(${other.toWGSL()})`;
            }
            else
            {
                this.toGLSL = () => `int(${other.toGLSL()})`;
                this.toWGSL = () => `i32(${other.toWGSL()})`;
            }
        }
        else
        {
            throw new Error('Invalid arguments for Int');
        }
    }

    /**
     * 赋值操作
     * @param value 要赋值的表达式
     */
    assign(value: Int | number): void
    {
        if (typeof value === 'number')
        {
            const intVal = new Int(value);
            new Assign(this, intVal);
        }
        else
        {
            new Assign(this, value);
        }
    }

    /**
     * 等于比较
     */
    equals(other: Int | number): Bool
    {
        const result = new Bool();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            result.toGLSL = () => `(${this.toGLSL()} == ${intValue})`;
            result.toWGSL = () => `(${this.toWGSL()} == ${intValue})`;
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

    /**
     * 取模运算
     */
    mod(other: Int | number): Int
    {
        const result = new Int();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            result.toGLSL = () => `${this.toGLSL()} % ${intValue}`;
            result.toWGSL = () => `${this.toWGSL()} % ${intValue}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} % ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} % ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }
}

/**
 * int 构造函数
 */
export function int(uniform: Uniform): Int;
export function int(attribute: Attribute): Int;
export function int(varying: Varying): Int;
export function int(builtin: Builtin): Int;
export function int(value: number): Int;
export function int(other: UInt): Int;
export function int(...args: (number | Uniform | Attribute | Varying | Builtin | UInt)[]): Int
{
    return new (Int as any)(...args);
}

