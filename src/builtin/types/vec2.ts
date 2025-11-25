import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { Float } from './float';
import { formatNumber } from '../formatNumber';

/**
 * Vec2 类，用于表示 vec2 字面量值或 uniform/attribute 变量
 */
export class Vec2 implements ShaderValue
{
    readonly glslType = 'vec2';
    readonly wgslType = 'vec2<f32>';

    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(x: number | Float, y: number | Float);
    constructor(...args: (number | Uniform | Attribute | Varying | Float)[])
    {
        if (args.length === 1)
        {
            // 处理 uniform、attribute 或 varying
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;

                this.toGLSL = (type: 'vertex' | 'fragment') => uniform.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => uniform.name;
                this.dependencies = [uniform];

                uniform.value = this;
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;

                this.toGLSL = (type: 'vertex' | 'fragment') => attribute.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => attribute.name;
                this.dependencies = [attribute];

                attribute.value = this;
            }
            else if (args[0] instanceof Varying)
            {
                const varying = args[0] as Varying;

                this.toGLSL = (type: 'vertex' | 'fragment') => varying.name;
                this.toWGSL = (type: 'vertex' | 'fragment') => varying.name;
                this.dependencies = [varying];

                varying.value = this;
            }
            else
            {
                throw new Error('Vec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2)
        {
            const x = args[0] as number | Float;
            const y = args[1] as number | Float;
            if (x instanceof Float || y instanceof Float)
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec2(${typeof x === 'number' ? formatNumber(x) : x.toGLSL(type)}, ${typeof y === 'number' ? formatNumber(y) : y.toGLSL(type)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec2<f32>(${typeof x === 'number' ? formatNumber(x) : x.toWGSL(type)}, ${typeof y === 'number' ? formatNumber(y) : y.toWGSL(type)})`;
                this.dependencies = [x, y].filter((arg): arg is Float => arg instanceof Float);
            }
            else
            {
                this.toGLSL = (type: 'vertex' | 'fragment') => `vec2(${formatNumber(x as number)}, ${formatNumber(y as number)})`;
                this.toWGSL = (type: 'vertex' | 'fragment') => `vec2<f32>(${formatNumber(x as number)}, ${formatNumber(y as number)})`;
                this.dependencies = [];
            }
        }
        else
        {
            throw new Error('Vec2 constructor: invalid arguments');
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

}

/**
 * vec2 构造函数
 */
export function vec2(uniform: Uniform): Vec2;
export function vec2(attribute: Attribute): Vec2;
export function vec2(varying: Varying): Vec2;
export function vec2(x: number | Float, y: number | Float): Vec2;
export function vec2(...args: any[]): Vec2
{
    if (args.length === 1) return new Vec2(args[0] as any);
    if (args.length === 2) return new Vec2(args[0] as any, args[1] as any);

    throw new Error('vec2: invalid arguments');
}
