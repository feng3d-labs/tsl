import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { Builtin } from '../builtin';
import { Float } from './float';
import { formatNumber } from '../formatNumber';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';

/**
 * Vec4 类型，表示 vec4 字面量值或 uniform/attribute 变量
 */
export class Vec4 implements ShaderValue
{
    readonly glslType = 'vec4';
    readonly wgslType = 'vec4<f32>';

    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(builtin: Builtin);
    constructor(varying: Varying);
    constructor(vec4: Vec4);
    constructor(xy: Vec2, z: number, w: number);
    constructor(xyz: Vec3, w: number | Float);
    constructor(x: number, y: number, z: number, w: number);
    constructor(...args: (number | Uniform | Attribute | Builtin | Varying | Vec2 | Vec3 | Float | Vec4)[])
    {
        if (args.length === 0) return;
        if (args.length === 1)
        {
            // 处理 uniform、attribute 或 builtin
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;
                uniform.value = this;

                this.toGLSL = (type: 'vertex' | 'fragment') => uniform.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => uniform.name;
                this.dependencies = [uniform];
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;

                this.toGLSL = (type: 'vertex' | 'fragment') => attribute.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => attribute.name;
                this.dependencies = [attribute];
                attribute.value = this;
            }
            else if (args[0] instanceof Builtin)
            {
                const builtin = args[0] as Builtin;

                this.toGLSL = (type) =>
                {
                    if (builtin.isPosition) return 'gl_Position';

                    throw new Error(`Builtin '${builtin.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
                };
                this.toWGSL = (type) => builtin.varName;
                this.dependencies = [builtin];
                builtin.value = this;
            }
            else if (args[0] instanceof Varying)
            {
                const varying = args[0] as Varying;

                this.toGLSL = (type: 'vertex' | 'fragment') => varying.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => varying.name;
                this.dependencies = [varying];
                varying.value = this;
            }
            else if (args[0] instanceof Vec4)
            {
                // 处理 vec4(vec4) 的情况，直接返回自身
                const vec4 = args[0] as Vec4;
                this.toGLSL = vec4.toGLSL;
                this.toWGSL = vec4.toWGSL;
                this.dependencies = vec4.dependencies;
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

            this.toGLSL = (type: 'vertex' | 'fragment') => `vec4(${xy.toGLSL(type)}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.toWGSL = (type: 'vertex' | 'fragment') => `vec4<f32>(${xy.toWGSL(type)}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.dependencies = [xy];
        }
        else if (args.length === 2 && args[0] instanceof Vec3 && (typeof args[1] === 'number' || args[1] instanceof Float))
        {
            // 处理 vec4(xyz: Vec3, w: number | Float) 的情况
            const xyz = args[0] as Vec3;
            const w = args[1] as number | Float;

            if (typeof w === 'number')
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec4(${xyz.toGLSL(type)}, ${formatNumber(w)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec4<f32>(${xyz.toWGSL(type)}, ${formatNumber(w)})`;
                this.dependencies = [xyz];
            }
            else
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec4(${xyz.toGLSL(type)}, ${w.toGLSL(type)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec4<f32>(${xyz.toWGSL(type)}, ${w.toWGSL(type)})`;
                this.dependencies = [xyz, w];
            }
        }
        else if (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number' && typeof args[3] === 'number')
        {
            // 从字面量值创建
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            const w = args[3] as number;

            this.toGLSL = (type: 'vertex' | 'fragment') => `vec4(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.toWGSL = (type: 'vertex' | 'fragment') => `vec4<f32>(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.dependencies = [];
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
     * 获取 w 分量
     */
    get w(): Float
    {
        const float = new Float();
        float.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.w`;
        float.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.w`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 xyz 分量（返回 Vec3）
     */
    get xyz(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.xyz`;
        vec3.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.xyz`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 rgb 分量（返回 Vec3）
     */
    get rgb(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.rgb`;
        vec3.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.rgb`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 alpha 分量（返回 Float）
     */
    get a(): Float
    {
        const float = new Float();
        float.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)}.a`;
        float.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)}.a`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 向量乘法（分量相乘或标量乘法）
     */
    multiply(other: Vec4 | Float | number): Vec4
    {
        const result = new Vec4();
        if (other instanceof Vec4)
        {
            // 检查 this 是否是复合表达式（包含运算符），如果是则加括号
            const thisExpr = this.toGLSL('vertex');
            const needsParens = thisExpr.includes('+') || thisExpr.includes('-') || thisExpr.includes('*') || thisExpr.includes('/');

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const thisStr = needsParens ? `(${this.toGLSL(type)})` : this.toGLSL(type);

                return `${thisStr} * ${other.toGLSL(type)}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const thisStr = needsParens ? `(${this.toWGSL(type)})` : this.toWGSL(type);

                return `${thisStr} * ${other.toWGSL(type)}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            // 检查 this 是否是复合表达式（包含运算符），如果是则加括号
            const thisExpr = this.toGLSL('vertex');
            const needsParens = thisExpr.includes('+') || thisExpr.includes('-') || thisExpr.includes('*') || thisExpr.includes('/');

            result.toGLSL = (type: 'vertex' | 'fragment') =>
            {
                const thisStr = needsParens ? `(${this.toGLSL(type)})` : this.toGLSL(type);

                return `${thisStr} * ${typeof other === 'number' ? other : other.toGLSL(type)}`;
            };
            result.toWGSL = (type: 'vertex' | 'fragment') =>
            {
                const thisStr = needsParens ? `(${this.toWGSL(type)})` : this.toWGSL(type);

                return `${thisStr} * ${typeof other === 'number' ? other : other.toWGSL(type)}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 向量加法
     */
    add(other: Vec4): Vec4
    {
        const result = new Vec4();
        result.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)} + ${other.toGLSL(type)}`;
        result.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)} + ${other.toWGSL(type)}`;
        result.dependencies = [this, other];

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
export function vec4(xy: Vec2, z: number, w: number): Vec4;
export function vec4(xyz: Vec3, w: number | Float): Vec4;
export function vec4(x: number, y: number, z: number, w: number): Vec4;
export function vec4(...args: any[]): Vec4
{
    if (args.length === 1) return new Vec4(args[0] as any);
    if (args.length === 2) return new Vec4(args[0] as any, args[1] as any);
    if (args.length === 3) return new Vec4(args[0] as any, args[1] as any, args[2] as any);
    if (args.length === 4) return new Vec4(args[0] as any, args[1] as any, args[2] as any, args[3] as any);

    throw new Error('vec4: invalid arguments');
}
