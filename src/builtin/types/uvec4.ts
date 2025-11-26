import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Float } from './float';

/**
 * Uvec4 类，用于表示 uvec4 字面量值或 uniform/attribute 变量
 */
export class Uvec4 implements ShaderValue
{
    readonly glslType = 'uvec4';
    readonly wgslType = 'vec4<u32>';

    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(x: number, y: number, z: number, w: number);
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
                throw new Error('Uvec4 constructor: invalid argument');
            }
        }
        else if (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number' && typeof args[3] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            const w = args[3] as number;
            this.toGLSL = () => `uvec4(${x}, ${y}, ${z}, ${w})`;
            this.toWGSL = () => `vec4<u32>(${x}, ${y}, ${z}, ${w})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Uvec4 constructor: invalid arguments');
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
}

/**
 * uvec4 构造函数
 */
export function uvec4(uniform: Uniform): Uvec4;
export function uvec4(attribute: Attribute): Uvec4;
export function uvec4(x: number, y: number, z: number, w: number): Uvec4;
export function uvec4(...args: any[]): Uvec4
{
    if (args.length === 1) return new Uvec4(args[0] as any);
    if (args.length === 4) return new Uvec4(args[0] as any, args[1] as any, args[2] as any, args[3] as any);

    throw new Error('uvec4: invalid arguments');
}

