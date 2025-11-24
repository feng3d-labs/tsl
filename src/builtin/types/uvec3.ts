import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Float } from './float';

/**
 * Uvec3 类，用于表示 uvec3 字面量值或 uniform/attribute 变量
 */
export class Uvec3 implements ShaderValue
{
    readonly glslType = 'uvec3';
    readonly wgslType = 'vec3<u32>';

    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(x: number, y: number, z: number);
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
                throw new Error('Uvec3 constructor: invalid argument');
            }
        }
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            this.toGLSL = () => `uvec3(${x}, ${y}, ${z})`;
            this.toWGSL = () => `vec3<u32>(${x}, ${y}, ${z})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Uvec3 constructor: invalid arguments');
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
}

/**
 * uvec3 构造函数
 */
export function uvec3(uniform: Uniform): Uvec3;
export function uvec3(attribute: Attribute): Uvec3;
export function uvec3(x: number, y: number, z: number): Uvec3;
export function uvec3(...args: any[]): Uvec3
{
    if (args.length === 1) return new Uvec3(args[0] as any);
    if (args.length === 3) return new Uvec3(args[0] as any, args[1] as any, args[2] as any);

    throw new Error('uvec3: invalid arguments');
}


