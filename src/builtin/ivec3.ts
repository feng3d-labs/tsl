import { Attribute } from '../Attribute';
import { IElement, IType } from '../IElement';
import { Uniform } from '../Uniform';
import { Float } from './float';

/**
 * IVec3 类，用于表示 ivec3 字面量值或 uniform/attribute 变量
 */
export class IVec3 implements IType
{
    readonly glslType = 'ivec3';
    readonly wgslType = 'vec3<i32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

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
                throw new Error('IVec3 constructor: invalid argument');
            }
        }
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            this.toGLSL = () => `ivec3(${x}, ${y}, ${z})`;
            this.toWGSL = () => `vec3<i32>(${x}, ${y}, ${z})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('IVec3 constructor: invalid arguments');
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
}

/**
 * ivec3 构造函数
 */
export function ivec3(uniform: Uniform): IVec3;
export function ivec3(attribute: Attribute): IVec3;
export function ivec3(x: number, y: number, z: number): IVec3;
export function ivec3(...args: any[]): IVec3
{
    if (args.length === 1) return new IVec3(args[0] as any);
    if (args.length === 3) return new IVec3(args[0] as any, args[1] as any, args[2] as any);

    throw new Error('ivec3: invalid arguments');
}
