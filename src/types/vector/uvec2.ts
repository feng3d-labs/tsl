import { Attribute } from '../../variables/attribute';
import { IElement, ShaderValue } from '../../core/IElement';
import { Uniform } from '../../variables/uniform';
import { Float } from '../scalar/float';

/**
 * Uvec2 类，用于表示 uvec2 字面量值或 uniform/attribute 变量
 * @internal 库外部不应直接使用 `new Uvec2()`，应使用 `uvec2()` 函数
 */
export class Uvec2 implements ShaderValue
{
    readonly glslType = 'uvec2';
    readonly wgslType = 'vec2<u32>';

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
                throw new Error('UVec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = () => `uvec2(${x}, ${y})`;
            this.toWGSL = () => `vec2<u32>(${x}, ${y})`;
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
 * uvec2 构造函数
 */
export function uvec2(uniform: Uniform): Uvec2;
export function uvec2(attribute: Attribute): Uvec2;
export function uvec2(x: number, y: number): Uvec2;
export function uvec2(...args: any[]): Uvec2
{
    return new (Uvec2 as any)(...args);
}

