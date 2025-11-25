import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Varying } from '../../Varying';
import { formatNumber } from '../formatNumber';

export class Float implements ShaderValue
{
    readonly glslType = 'float';
    readonly wgslType = 'f32';

    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;
    dependencies: IElement[];

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(value: number);
    constructor(...args: (number | Uniform | Attribute | Varying)[])
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
        else if (args.length === 1 && args[0] instanceof Varying)
        {
            const varying = args[0] as Varying;
            this.dependencies = [varying];
            this.toGLSL = (type: 'vertex' | 'fragment') => varying.name;
            this.toWGSL = (type: 'vertex' | 'fragment') => varying.name;
            varying.value = this;
        }
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            this.toGLSL = () => formatNumber(value);
            this.toWGSL = () => formatNumber(value);
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for Float');
        }
    }

}

/**
 * float 构造函数
 * 如果传入单个 Uniform、Attribute 或 Varying 实例，则将类型信息保存到对应的 value 属性
 */
export function float(): Float;
export function float(uniform: Uniform): Float;
export function float(attribute: Attribute): Float;
export function float(varying: Varying): Float;
export function float(value: number): Float;
export function float(...args: (number | Uniform | Attribute | Varying)[]): Float
{
    if (args.length === 0) return new Float();

    if (args.length === 1) return new Float(args[0] as any);

    throw new Error('Invalid arguments for float');
}