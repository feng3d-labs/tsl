import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { formatOperand } from '../expressionUtils';
import { formatNumber } from '../formatNumber';
import { Float } from './float';
import { Vec2 } from './vec2';

/**
 * Vec3 类，用于表示 vec3 字面量值或 uniform/attribute 变量
 * @internal 库外部不应直接使用 `new Vec3()`，应使用 `vec3()` 函数
 */
export class Vec3 implements ShaderValue
{
    readonly glslType = 'vec3';
    readonly wgslType = 'vec3<f32>';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: Float | number);
    constructor(x: number, y: number, z: number);
    constructor(vec2: Vec2, z: Float | number);
    constructor(...args: (number | Uniform | Attribute | Varying | Float | Vec2)[])
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
        else if (args.length === 1 && (typeof args[0] === 'number' || args[0] instanceof Float))
        {
            const value = args[0] as number | Float;
            if (typeof value === 'number')
            {
                this.toGLSL = () => `vec3(${formatNumber(value)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(value)})`;
                this.dependencies = [];
            }
            else
            {
                this.toGLSL = () => `vec3(${value.toGLSL()})`;
                this.toWGSL = () => `vec3<f32>(${value.toWGSL()})`;
                this.dependencies = [value];
            }
        }
        else if (args.length === 2 && args[0] instanceof Vec2)
        {
            // 从 vec2 和 float/number 构造 vec3
            const vec2 = args[0] as Vec2;
            const z = args[1] as Float | number;
            if (typeof z === 'number')
            {
                this.toGLSL = () => `vec3(${vec2.toGLSL()}, ${formatNumber(z)})`;
                this.toWGSL = () => `vec3<f32>(${vec2.toWGSL()}, ${formatNumber(z)})`;
                this.dependencies = [vec2];
            }
            else
            {
                this.toGLSL = () => `vec3(${vec2.toGLSL()}, ${z.toGLSL()})`;
                this.toWGSL = () => `vec3<f32>(${vec2.toWGSL()}, ${z.toWGSL()})`;
                this.dependencies = [vec2, z];
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
                this.toGLSL = () => `vec3(${formatNumber(x)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(x)})`;
            }
            else
            {
                this.toGLSL = () => `vec3(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
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
        float.toGLSL = () => `${this.toGLSL()}.x`;
        float.toWGSL = () => `${this.toWGSL()}.x`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 y 分量
     */
    get y(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.y`;
        float.toWGSL = () => `${this.toWGSL()}.y`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 z 分量
     */
    get z(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.z`;
        float.toWGSL = () => `${this.toWGSL()}.z`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 r 分量（返回 Float，等同于 x）
     */
    get r(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.r`;
        float.toWGSL = () => `${this.toWGSL()}.r`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 g 分量（返回 Float，等同于 y）
     */
    get g(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.g`;
        float.toWGSL = () => `${this.toWGSL()}.g`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 b 分量（返回 Float，等同于 z）
     */
    get b(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.b`;
        float.toWGSL = () => `${this.toWGSL()}.b`;
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
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toWGSL());

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
    subtract(other: Vec3): Vec3
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

    /**
     * 除法运算
     */
    divide(other: Vec3 | Float | number): Vec3
    {
        const result = new Vec3();
        if (other instanceof Vec3)
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }
}

/**
 * vec3 构造函数
 */
export function vec3(): Vec3;
export function vec3(uniform: Uniform): Vec3;
export function vec3(attribute: Attribute): Vec3;
export function vec3(varying: Varying): Vec3;
export function vec3(value: Float | number): Vec3;
export function vec3(x: number, y: number, z: number): Vec3;
export function vec3(vec2: Vec2, z: Float | number): Vec3;
export function vec3(...args: (number | Uniform | Attribute | Varying | Float | Vec2)[]): Vec3
{
    return new (Vec3 as any)(...args);
}
