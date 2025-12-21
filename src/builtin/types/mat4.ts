import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Vec4 } from './vec4';

/**
 * Mat4 类，用于表示 mat4 字面量值或 uniform/attribute 变量
 * @internal 库外部不应直接使用 `new Mat4()`，应使用 `mat4()` 函数
 */
export class Mat4 implements ShaderValue
{
    static readonly glslType = 'mat4';
    static readonly wgslType = 'mat4x4<f32>';
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

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

    multiply<T extends Mat4 | Vec4>(other: T): T
    {
        if (other instanceof Vec4)
        {
            const vec4 = new Vec4(0, 0, 0, 0);
            vec4.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            vec4.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
            vec4.dependencies = [this, other];

            return vec4 as T;
        }
        else
        {
            const mat4 = new Mat4();
            mat4.toGLSL = () => `${this.toGLSL()} * ${other.toGLSL()}`;
            mat4.toWGSL = () => `${this.toWGSL()} * ${other.toWGSL()}`;
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
    return new (Mat4 as any)(...args);
}
