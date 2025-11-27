import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { formatNumber } from '../formatNumber';
import { Float } from './float';
import { formatOperand } from '../expressionUtils';

export class Vec3 implements ShaderValue
{
    readonly glslType = 'vec3';
    readonly wgslType = 'vec3<f32>';
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment', version?: 1 | 2) => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: Float | number);
    constructor(x: number, y: number, z: number);
    constructor(...args: (number | Uniform | Attribute | Varying | Float)[])
    {
        if (args.length === 0) return;
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
        else if (args.length === 1 && (typeof args[0] === 'number' || args[0] instanceof Float))
        {
            const value = args[0] as number | Float;
            if (typeof value === 'number')
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec3(${formatNumber(value)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec3<f32>(${formatNumber(value)})`;
                this.dependencies = [];
            }
            else
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec3(${value.toGLSL(type)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec3<f32>(${value.toWGSL(type)})`;
                this.dependencies = [value];
            }
        }
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;

            // 如果三个参数相同，使用单个参数形式
            if (x === y && y === z)
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec3(${formatNumber(x)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec3<f32>(${formatNumber(x)})`;
            }
            else
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec3(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec3<f32>(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
            }
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for vec3');
        }
    }

    /**
     * 获取 x 分量
     */
    get x(): Float
    {
        const float = new Float();
        float.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.x`;
        float.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.x`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 y 分量
     */
    get y(): Float
    {
        const float = new Float();
        float.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.y`;
        float.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.y`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 z 分量
     */
    get z(): Float
    {
        const float = new Float();
        float.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.z`;
        float.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.z`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 乘法运算
     */
    multiply(other: Vec3 | Float | number): Vec3
    {
        const result = new Vec3();
        if (other instanceof Vec3)
        {
            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '*', false, type, (t) => other.toGLSL(t));

                return `${left} * ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '*', false, type, (t) => other.toWGSL(t));

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '*', true, type, (t) => this.toGLSL(t));
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, type, (t) => other.toGLSL(t));

                return `${left} * ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '*', true, type, (t) => this.toWGSL(t));
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, type, (t) => other.toWGSL(t));

                return `${left} * ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Vec3): Vec3
    {
        const result = new Vec3();
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
    subtract(other: Vec3): Vec3
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

    /**
     * 除法运算
     */
    divide(other: Vec3 | Float | number): Vec3
    {
        const result = new Vec3();
        if (other instanceof Vec3)
        {
            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '/', true, type, (t) => this.toGLSL(t));
                const right = formatOperand(other, '/', false, type, (t) => other.toGLSL(t));

                return `${left} / ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '/', true, type, (t) => this.toWGSL(t));
                const right = formatOperand(other, '/', false, type, (t) => other.toWGSL(t));

                return `${left} / ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '/', true, type, (t) => this.toGLSL(t));
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, type, (t) => other.toGLSL(t));

                return `${left} / ${right}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const left = formatOperand(this, '/', true, type, (t) => this.toWGSL(t));
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, type, (t) => other.toWGSL(t));

                return `${left} / ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }
}

/**
 * vec3 构造函数
 * 如果传入单个 Uniform、Attribute 或 Varying 实例，则将类型信息保存到对应的 value 属性
 */
export function vec3(): Vec3;
export function vec3(uniform: Uniform): Vec3;
export function vec3(attribute: Attribute): Vec3;
export function vec3(varying: Varying): Vec3;
export function vec3(value: Float | number): Vec3;
export function vec3(x: number, y: number, z: number): Vec3;
export function vec3(...args: (number | Uniform | Attribute | Varying | Float)[]): Vec3
{
    if (args.length === 0) return new Vec3();

    if (args.length === 1) return new Vec3(args[0] as any);

    if (args.length === 3) return new Vec3(args[0] as number, args[1] as number, args[2] as number);

    throw new Error('Invalid arguments for vec3');
}
