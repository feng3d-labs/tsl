import { Attribute } from '../Attribute';
import { IElement } from '../IElement';
import { Uniform } from '../Uniform';
import { Float } from './float';
import { formatNumber } from './formatNumber';

/**
 * Vec2 类，用于表示 vec2 字面量值或 uniform/attribute 变量
 */
export class Vec2 implements IElement
{
    readonly glslType = 'vec2';
    readonly wgslType = 'vec2<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(x: number, y: number);
    constructor(...args: (number | Uniform | Attribute)[])
    {
        if (args.length === 1)
        {
            // 处理 uniform 或 attribute
            if (args[0] instanceof Uniform)
            {
                const uniform = args[0] as Uniform;

                this.toGLSL = () => uniform.name;
                this.toWGSL = () => uniform.name;
                this.dependencies = [uniform];

                uniform.value = this;
            }
            else if (args[0] instanceof Attribute)
            {
                const attribute = args[0] as Attribute;

                this.toGLSL = () => attribute.name;
                this.toWGSL = () => attribute.name;
                this.dependencies = [attribute];

                attribute.value = this;
            }
            else
            {
                throw new Error('Vec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = () => `vec2(${formatNumber(x)}, ${formatNumber(y)})`;
            this.toWGSL = () => `vec2<f32>(${formatNumber(x)}, ${formatNumber(y)})`;
            this.dependencies = [];
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
}

/**
 * vec2 构造函数
 */
export function vec2(uniform: Uniform): Vec2;
export function vec2(attribute: Attribute): Vec2;
export function vec2(x: number, y: number): Vec2;
export function vec2(...args: any[]): Vec2
{
    if (args.length === 1) return new Vec2(args[0] as any);
    if (args.length === 2) return new Vec2(args[0] as any, args[1] as any);

    throw new Error('vec2: invalid arguments');
}
