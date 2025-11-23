import { Attribute } from '../Attribute';
import { IElement, IType } from '../IElement';
import { Uniform } from '../Uniform';
import { formatNumber } from './formatNumber';

export class Vec3 implements IType
{
    readonly glslType = 'vec3';
    readonly wgslType = 'vec3<f32>';
    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(x: number, y: number, z: number);
    constructor(...args: (number | Uniform | Attribute)[])
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
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            this.toGLSL = (type: 'vertex' | 'fragment') => `vec3(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
            this.toWGSL = (type: 'vertex' | 'fragment') => `vec3<f32>(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for vec3');
        }
    }
}

/**
 * vec3 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将类型信息保存到 uniform.value 或 attribute.value
 */
export function vec3(): Vec3;
export function vec3(uniform: Uniform): Vec3;
export function vec3(attribute: Attribute): Vec3;
export function vec3(x: number, y: number, z: number): Vec3;
export function vec3(...args: (number | Uniform | Attribute)[]): Vec3
{
    if (args.length === 0) return new Vec3();

    if (args.length === 1) return new Vec3(args[0] as any);

    if (args.length === 3) return new Vec3(args[0] as number, args[1] as number, args[2] as number);

    throw new Error('Invalid arguments for vec3');
}
