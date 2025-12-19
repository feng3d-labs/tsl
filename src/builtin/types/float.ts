import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { Assign } from '../assign';
import { formatOperand } from '../expressionUtils';
import { formatNumber } from '../formatNumber';
import { Bool } from './bool';
import { UInt } from './uint';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';
import { Vec4 } from './vec4';

/**
 * Float 类，用于表示浮点数类型（float/f32）
 * @internal 库外部不应直接使用 `new Float()`，应使用 `float()` 函数
 */
export class Float implements ShaderValue
{
    readonly glslType = 'float';
    readonly wgslType = 'f32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: number);
    constructor(value: UInt);
    constructor(...args: (number | Uniform | Attribute | Varying | UInt)[])
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
        else if (args.length === 1 && args[0] instanceof UInt)
        {
            const value = args[0] as UInt;
            this.toGLSL = () => `float(${value.toGLSL()})`;
            this.toWGSL = () => `f32(${value.toWGSL()})`;
            this.dependencies = [value];
        }
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            this.toGLSL = () => formatNumber(value);
            this.toWGSL = () => formatNumber(value);
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for Float');
        }
    }

    /**
     * 比较两个值是否相等
     */
    equals(other: Float | number): Bool
    {
        const result = new Bool();
        const otherIsFloat = other instanceof Float;

        if (typeof other === 'number')
        {
            // 与数字字面量比较
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();

                return `${thisStr} == ${formatNumber(other)}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();

                return `${thisStr} == ${formatNumber(other)}`;
            };

            result.dependencies = [...this.dependencies];
        }
        else if (otherIsFloat)
        {
            // 与 Float 对象比较
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();
                const otherStr = other.toGLSL();

                return `${thisStr} == ${otherStr}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();
                const otherStr = other.toWGSL();

                return `${thisStr} == ${otherStr}`;
            };

            result.dependencies = [...this.dependencies, ...other.dependencies];
        }
        else
        {
            throw new Error('Invalid argument for equals: ' + typeof other);
        }

        return result;
    }

    /**
     * 乘法运算
     */
    multiply(other: Float | number): Float;
    multiply(other: Vec3): Vec3;
    multiply(other: Vec4): Vec4;
    multiply(other: Vec2): Vec2;
    multiply(other: Float | number | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
    {
        if (other instanceof Vec3)
        {
            const result = new Vec3();

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec3 优化为 -Vec3
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec3 优化为 -Vec3
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec4 优化为 -Vec4
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec4 优化为 -Vec4
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec2 优化为 -Vec2
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec2 优化为 -Vec2
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        const result = new Float();

        // 检查 this 是否是字面量 -1.0
        const thisValue = this.toGLSL();
        const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

        result.toGLSL = () =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);
                if (hasOp && !isScientificNotation && !isNumber)
                {
                    // 复杂表达式需要括号
                    return `-(${rightStr})`;
                }

                return `-${rightStr}`;
            }

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toGLSL());
            const left = formatOperand(this, '*', true, () => this.toGLSL());

            return `${left} * ${right}`;
        };
        result.toWGSL = () =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);
                if (hasOp && !isScientificNotation && !isNumber)
                {
                    // 复杂表达式需要括号
                    return `-(${rightStr})`;
                }

                return `-${rightStr}`;
            }

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toWGSL());
            const left = formatOperand(this, '*', true, () => this.toWGSL());

            return `${left} * ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Float): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toGLSL());
            const right = formatOperand(other, '+', false, () => other.toGLSL());

            return `${left} + ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toWGSL());
            const right = formatOperand(other, '+', false, () => other.toWGSL());

            return `${left} + ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     */
    subtract(other: Float): Float;
    subtract(other: number): Float;
    subtract(other: Vec3): Vec3;
    subtract(other: Vec4): Vec4;
    subtract(other: Vec2): Vec2;
    subtract(other: Float | Vec2 | Vec3 | Vec4 | number): Float | Vec2 | Vec3 | Vec4
    {
        if (other instanceof Vec3)
        {
            const result = new Vec3();

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }

        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '-', false, () => other.toGLSL());

            return `${left} - ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '-', false, () => other.toWGSL());

            return `${left} - ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Float | number): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '/', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toGLSL());

            return `${left} / ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '/', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toWGSL());

            return `${left} / ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 取模运算
     */
    mod(other: Float | number): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '%', false, () => other.toGLSL());

            return `${left} % ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '%', false, () => other.toWGSL());

            return `${left} % ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 赋值操作（用于对内置变量进行赋值）
     * @param value 要赋值的表达式
     */
    assign(value: Float): void
    {
        new Assign(this, value);
    }

}

/**
 * float 构造函数
 * 如果传入单个 Uniform、Attribute 或 Varying 实例，则将类型信息保存到对应的 value 属性
 */
export function float(): Float;
export function float(uniform: Uniform): Float;
export function float(attribute: Attribute): Float;
export function float(varying: Varying): Float;
export function float(value: number): Float;
export function float(value: UInt): Float;
export function float(...args: any[]): Float
{
    return new (Float as any)(...args);
}