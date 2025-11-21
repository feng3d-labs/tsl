import { Attribute } from '../Attribute';
import { IElement, IType } from '../IElement';
import { Uniform } from '../Uniform';

/**
 * Mat4 类，用于表示 mat4 字面量值或 uniform/attribute 变量
 */
export class Mat4 implements IType
{
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(...args: (Uniform | Attribute)[])
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
                throw new Error('Mat4 constructor: invalid argument');
            }
        }
        else
        {
            throw new Error('Mat4 constructor: invalid arguments');
        }
    }


}

/**
 * mat4 构造函数
 */
export function mat4(uniform: Uniform): Mat4;
export function mat4(attribute: Attribute): Mat4;
export function mat4(...args: any[]): Mat4
{
    if (args.length === 1) return new Mat4(args[0] as any);

    throw new Error('mat4: invalid arguments');
}

