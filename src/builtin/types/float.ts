import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { formatNumber } from '../formatNumber';
import { formatOperand } from '../expressionUtils';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';
import { Vec4 } from './vec4';

export class Float implements ShaderValue
{
    readonly glslType = 'float';
    readonly wgslType = 'f32';

    toGLSL: (type: 'vertex' | 'fragment', version?: 1 | 2) => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;
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
            this.toGLSL = (type: 'vertex' | 'fragment') => uniform.name;
            this.toWGSL = (type: 'vertex' | 'fragment') => uniform.name;
            uniform.value = this;
        }
        else if (args.length === 1 && args[0] instanceof Attribute)
        {
            const attribute = args[0] as Attribute;
            this.dependencies = [attribute];
            this.toGLSL = (type: 'vertex' | 'fragment') => attribute.name;
            this.toWGSL = (type: 'vertex' | 'fragment') => attribute.name;
            attribute.value = this;
        }
        else if (args.length === 1 && args[0] instanceof Varying)
        {
            const varying = args[0] as Varying;
            this.dependencies = [varying];
            this.toGLSL = (type: 'vertex' | 'fragment') => varying.name;
            this.toWGSL = (type: 'vertex' | 'fragment') => varying.name;
            varying.value = this;
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
            const thisValue = this.toGLSL('vertex');
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toGLSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toWGSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL('vertex');
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toGLSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toWGSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL('vertex');
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toGLSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const rightStr = other.toWGSL(type);
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

                const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '*', false, type, (t) => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        const result = new Float();

        // 检查 this 是否是字面量 -1.0
        const thisValue = this.toGLSL('vertex');
        const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

        result.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toGLSL(type);
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

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, type, (t) => other.toGLSL(t));
            const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));

            return `${left} * ${right}`;
        };
        result.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toWGSL(type);
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

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, type, (t) => other.toWGSL(t));
            const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));

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

        result.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '+', true, type, (t) => this.toGLSL(t));
            const right = formatOperand(other, '+', false, type, (t) => other.toGLSL(t));

            return `${left} + ${right}`;
        };
        result.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '+', true, type, (t) => this.toWGSL(t));
            const right = formatOperand(other, '+', false, type, (t) => other.toWGSL(t));

            return `${left} + ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     */
    subtract(other: Float): Float;
    subtract(other: Vec3): Vec3;
    subtract(other: Vec4): Vec4;
    subtract(other: Vec2): Vec2;
    subtract(other: Float | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
    {
        if (other instanceof Vec3)
        {
            const result = new Vec3();

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toGLSL(t));

                return `${left} - ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toWGSL(t));

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toGLSL(t));

                return `${left} - ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toWGSL(t));

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toGLSL(t));

                return `${left} - ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '-', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '-', false, type, (t) => other.toWGSL(t));

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        const result = new Float();

        result.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '-', true, type, (t) => this.toGLSL(t));
            const right = formatOperand(other, '-', false, type, (t) => other.toGLSL(t));

            return `${left} - ${right}`;
        };
        result.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '-', true, type, (t) => this.toWGSL(t));
            const right = formatOperand(other, '-', false, type, (t) => other.toWGSL(t));

            return `${left} - ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Float | number): Float
    {
        const result = new Float();

        result.toGLSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '/', true, type, (t) => this.toGLSL(t));
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, type, (t) => other.toGLSL(t));

            return `${left} / ${right}`;
        };
        result.toWGSL = (type: 'vertex' | 'fragment') =>
        {
            const left = formatOperand(this, '/', true, type, (t) => this.toWGSL(t));
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, type, (t) => other.toWGSL(t));

            return `${left} / ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
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
export function float(...args: (number | Uniform | Attribute | Varying)[]): Float
{
    if (args.length === 0) return new Float();

    if (args.length === 1) return new Float(args[0] as any);

    throw new Error('Invalid arguments for float');
}