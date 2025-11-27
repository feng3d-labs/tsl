import { Attribute } from '../../Attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../Uniform';
import { Vec4 } from './vec4';

/**
 * Mat4 类，用于表示 mat4 字面量值或 uniform/attribute 变量
 */
export class Mat4 implements ShaderValue
{
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';

    dependencies: IElement[];
    toGLSL: (type: 'vertex' | 'fragment') => string;
    toWGSL: (type: 'vertex' | 'fragment') => string;

    constructor();
    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(...args: (Uniform | Attribute)[])
    {
        if (args.length === 0) return;
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
                throw new Error('Mat4 constructor: invalid argument');
            }
        }
        else
        {
            throw new Error('Mat4 constructor: invalid arguments');
        }
    }

    multiply<T extends Mat4 | Vec4>(other: T): T
    {
        if (other instanceof Vec4)
        {
            const vec4 = new Vec4(0, 0, 0, 0);
            vec4.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)} * ${other.toGLSL(type)}`;
            vec4.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)} * ${other.toWGSL(type)}`;
            vec4.dependencies = [this, other];

            return vec4 as T;
        }
        else
        {
            const mat4 = new Mat4();
            mat4.toGLSL = (type: 'vertex' | 'fragment') => `${this.toGLSL(type)} * ${other.toGLSL(type)}`;
            mat4.toWGSL = (type: 'vertex' | 'fragment') => `${this.toWGSL(type)} * ${other.toWGSL(type)}`;
            mat4.dependencies = [this, other];

            return mat4 as T;
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

