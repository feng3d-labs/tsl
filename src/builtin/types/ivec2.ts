import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Float } from './float';

/**
 * IVec2 类，用于表示 ivec2 字面量值或 uniform/attribute 变量
 * @internal 库外部不应直接使用 `new IVec2()`，应使用 `ivec2()` 函数
 */
export class IVec2 implements ShaderValue
{
    readonly glslType = 'ivec2';
    readonly wgslType = 'vec2<i32>';

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
                throw new Error('IVec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = () => `ivec2(${x}, ${y})`;
            this.toWGSL = () => `vec2<i32>(${x}, ${y})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('IVec2 constructor: invalid arguments');
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
 * ivec2 构造函数
 */
export function ivec2(uniform: Uniform): IVec2;
export function ivec2(attribute: Attribute): IVec2;
export function ivec2(x: number, y: number): IVec2;
export function ivec2(...args: any[]): IVec2
{
    return new (IVec2 as any)(...args);
}

