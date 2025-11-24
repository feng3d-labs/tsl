import { Attribute } from '../Attribute';
import { IElement, ShaderValue } from '../IElement';
import { Uniform } from '../Uniform';
import { Float } from './float';

/**
 * UVec2 类，用于表示 uvec2 字面量值或 uniform/attribute 变量
 */
export class Uvec2 implements ShaderValue
{
    readonly glslType = 'uvec2';
    readonly wgslType = 'vec2<u32>';

    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

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
            else
            {
                throw new Error('UVec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = (type: 'vertex' | 'fragment') => `uvec2(${x}, ${y})`;
            this.toWGSL = (type: 'vertex' | 'fragment') => `vec2<u32>(${x}, ${y})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('UVec2 constructor: invalid arguments');
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
 * uvec2 构造函数
 */
export function uvec2(uniform: Uniform): Uvec2;
export function uvec2(attribute: Attribute): Uvec2;
export function uvec2(x: number, y: number): Uvec2;
export function uvec2(...args: any[]): Uvec2
{
    if (args.length === 1) return new Uvec2(args[0] as any);
    if (args.length === 2) return new Uvec2(args[0] as any, args[1] as any);

    throw new Error('uvec2: invalid arguments');
}

