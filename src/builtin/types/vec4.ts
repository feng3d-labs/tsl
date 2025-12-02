import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { Builtin } from '../builtin';
import { Color } from '../color';
import { formatOperand } from '../expressionUtils';
import { formatNumber } from '../formatNumber';
import { Float } from './float';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';

/**
 * Vec4 类型，表示 vec4 字面量值或 uniform/attribute 变量
 */
export class Vec4 implements ShaderValue
{
    readonly glslType = 'vec4';
    readonly wgslType = 'vec4<f32>';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(builtin: Builtin);
    constructor(varying: Varying);
    constructor(color: Color);
    constructor(vec4: Vec4);
    constructor(xy: Vec2, z: number, w: number);
    constructor(xyz: Vec3, w: number | Float);
    constructor(x: number | Float, y: number | Float, z: number | Float, w: number | Float);
    constructor(...args: (number | Uniform | Attribute | Builtin | Varying | Color | Vec2 | Vec3 | Float | Vec4)[])
    {
        if (args.length === 0) return;
        if (args.length === 1)
        {
            // 处理 uniform、attribute 或 builtin
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;
                uniform.value = this;

                this.toGLSL = () => uniform.name;
                this.toWGSL = () => uniform.name;
                this.dependencies = [uniform];
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;

                this.toGLSL = () => attribute.name;
                this.toWGSL = () => attribute.name;
                this.dependencies = [attribute];
                attribute.value = this;
            }
            else if (args[0] instanceof Builtin)
            {
                const builtin = args[0] as Builtin;

                this.toGLSL = () =>
                {
                    if (builtin.isPosition) return 'gl_Position';

                    throw new Error(`Builtin '${builtin.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
                };
                this.toWGSL = () => builtin.name;
                this.dependencies = [builtin];
                builtin.value = this;
            }
            else if (args[0] instanceof Varying)
            {
                const varying = args[0] as Varying;

                this.toGLSL = () => varying.name;
                this.toWGSL = () => varying.name;
                this.dependencies = [varying];
                varying.value = this;
            }
            else if (args[0] instanceof Color)
            {
                const color = args[0] as Color;

                // Color 的 toGLSL 和 toWGSL 会在 fragmentOutput 中被重写为字段名
                // 这里先使用 color 的默认实现，后续会被 fragmentOutput 覆盖
                this.toGLSL = () => color.toGLSL();
                this.toWGSL = () => color.toWGSL();
                this.dependencies = [color];
            }
            else if (args[0] instanceof Vec4)
            {
                // 处理 vec4(vec4) 的情况，直接返回自身
                const vec4 = args[0] as Vec4;
                this.toGLSL = vec4.toGLSL;
                this.toWGSL = vec4.toWGSL;
                this.dependencies = vec4.dependencies;
            }
            else if (typeof args[0] === 'number' || args[0] instanceof Float)
            {
                // 处理 vec4(value: number | Float) 的情况
                const value = args[0] as number | Float;
                if (typeof value === 'number')
                {
                    this.toGLSL = () => `vec4(${formatNumber(value)})`;
                    this.toWGSL = () => `vec4<f32>(${formatNumber(value)})`;
                    this.dependencies = [];
                }
                else
                {
                    this.toGLSL = () => `vec4(${value.toGLSL()})`;
                    this.toWGSL = () => `vec4<f32>(${value.toWGSL()})`;
                    this.dependencies = [value];
                }
            }
            else
            {
                throw new Error('Vec4 constructor: invalid argument');
            }
        }
        else if (args.length === 3 && args[0] instanceof Vec2 && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            // 处理 vec4(xy: Vec2, z: number, w: number) 的情况
            const xy = args[0] as Vec2;
            const z = args[1] as number;
            const w = args[2] as number;

            this.toGLSL = () => `vec4(${xy.toGLSL()}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.toWGSL = () => `vec4<f32>(${xy.toWGSL()}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.dependencies = [xy];
        }
        else if (args.length === 2 && args[0] instanceof Vec3 && (typeof args[1] === 'number' || args[1] instanceof Float))
        {
            // 处理 vec4(xyz: Vec3, w: number | Float) 的情况
            const xyz = args[0] as Vec3;
            const w = args[1] as number | Float;

            if (typeof w === 'number')
            {
                this.toGLSL = () => `vec4(${xyz.toGLSL()}, ${formatNumber(w)})`;
                this.toWGSL = () => `vec4<f32>(${xyz.toWGSL()}, ${formatNumber(w)})`;
                this.dependencies = [xyz];
            }
            else
            {
                this.toGLSL = () => `vec4(${xyz.toGLSL()}, ${w.toGLSL()})`;
                this.toWGSL = () => `vec4<f32>(${xyz.toWGSL()}, ${w.toWGSL()})`;
                this.dependencies = [xyz, w];
            }
        }
        else if (args.length === 4)
        {
            // 处理 vec4(x: number | Float, y: number | Float, z: number | Float, w: number | Float) 的情况
            const x = args[0] as number | Float;
            const y = args[1] as number | Float;
            const z = args[2] as number | Float;
            const w = args[3] as number | Float;

            // 如果四个参数都是 number 且相同，使用单个参数形式
            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && typeof w === 'number' && x === y && y === z && z === w)
            {
                this.toGLSL = () => `vec4(${formatNumber(x)})`;
                this.toWGSL = () => `vec4<f32>(${formatNumber(x)})`;
                this.dependencies = [];
            }
            else
            {
                this.toGLSL = () => `vec4(${typeof x === 'number' ? formatNumber(x) : x.toGLSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toGLSL()}, ${typeof z === 'number' ? formatNumber(z) : z.toGLSL()}, ${typeof w === 'number' ? formatNumber(w) : w.toGLSL()})`;
                this.toWGSL = () => `vec4<f32>(${typeof x === 'number' ? formatNumber(x) : x.toWGSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toWGSL()}, ${typeof z === 'number' ? formatNumber(z) : z.toWGSL()}, ${typeof w === 'number' ? formatNumber(w) : w.toWGSL()})`;
                this.dependencies = [x, y, z, w].filter((arg): arg is Float => arg instanceof Float);
            }
        }
        else
        {
            throw new Error('Vec4 constructor: invalid arguments');
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
     * 获取 w 分量
     */
    get w(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.w`;
        float.toWGSL = () => `${this.toWGSL()}.w`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 xyz 分量（返回 Vec3）
     */
    get xyz(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${this.toGLSL()}.xyz`;
        vec3.toWGSL = () => `${this.toWGSL()}.xyz`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 rgb 分量（返回 Vec3）
     */
    get rgb(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${this.toGLSL()}.rgb`;
        vec3.toWGSL = () => `${this.toWGSL()}.rgb`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 alpha 分量（返回 Float）
     */
    get a(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.a`;
        float.toWGSL = () => `${this.toWGSL()}.a`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 乘法运算
     */
    multiply(other: Vec4 | Float | number): Vec4
    {
        const result = new Vec4();
        if (other instanceof Vec4)
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
    add(other: Vec4): Vec4
    {
        const result = new Vec4();
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
    subtract(other: Vec4): Vec4
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

    /**
     * 除法运算
     */
    divide(other: Vec4 | Vec3 | Float | number): Vec4
    {
        const result = new Vec4();
        if (other instanceof Vec4 || other instanceof Vec3)
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
 * vec4 构造函数
 * 直接调用 Vec4 构造函数，所有参数处理逻辑都在 Vec4 构造函数中
 */
export function vec4(uniform: Uniform): Vec4;
export function vec4(attribute: Attribute): Vec4;
export function vec4(builtin: Builtin): Vec4;
export function vec4(varying: Varying): Vec4;
export function vec4(color: Color): Vec4;
export function vec4(value: number | Float): Vec4;
export function vec4(xy: Vec2, z: number, w: number): Vec4;
export function vec4(xyz: Vec3, w: number | Float): Vec4;
export function vec4(x: number | Float, y: number | Float, z: number | Float, w: number | Float): Vec4;
export function vec4(...args: any[]): Vec4
{
    if (args.length === 1) return new Vec4(args[0] as any);
    if (args.length === 2) return new Vec4(args[0] as any, args[1] as any);
    if (args.length === 3) return new Vec4(args[0] as any, args[1] as any, args[2] as any);
    if (args.length === 4) return new Vec4(args[0] as any, args[1] as any, args[2] as any, args[3] as any);

    throw new Error('vec4: invalid arguments');
}
