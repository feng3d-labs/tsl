import { Attribute } from '../../attribute';
import { IElement, ShaderValue } from '../../IElement';
import { Uniform } from '../../uniform';
import { Varying } from '../../varying';
import { Builtin } from '../builtin';
import { formatOperand } from '../expressionUtils';
import { formatNumber } from '../formatNumber';
import { Float } from './float';

/**
 * Vec2 类，用于表示 vec2 字面量值或 uniform/attribute 变量
 * @internal 库外部不应直接使用 `new Vec2()`，应使用 `vec2()` 函数
 */
export class Vec2 implements ShaderValue
{
    readonly glslType = 'vec2';
    readonly wgslType = 'vec2<f32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(uniform: Uniform);
    constructor(attribute: Attribute);
    constructor(varying: Varying);
    constructor(builtin: Builtin);
    constructor(x: number | Float, y: number | Float);
    constructor(...args: (number | Uniform | Attribute | Varying | Float | Builtin)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于 var_ 函数创建新实例
            return;
        }
        if (args.length === 1)
        {
            // 处理 uniform、attribute 或 varying
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
            else if (args[0] instanceof Varying)
            {
                const varying = args[0] as Varying;

                this.toGLSL = () => varying.name;
                this.toWGSL = () => varying.name;
                this.dependencies = [varying];

                varying.value = this;
            }
            else if (args[0] instanceof Builtin)
            {
                const builtin = args[0] as Builtin;

                this.toGLSL = () => builtin.toGLSL();
                this.toWGSL = () => builtin.name;
                this.dependencies = [builtin];
                builtin.value = this;
            }
            else
            {
                throw new Error('Vec2 构造函数：无效的参数');
            }
        }
        else if (args.length === 2)
        {
            const x = args[0];
            const y = args[1];

            // 验证参数类型：必须是 number 或 Float
            if ((typeof x !== 'number' && !(x instanceof Float)) || (typeof y !== 'number' && !(y instanceof Float)))
            {
                throw new Error('Vec2 构造函数：无效的参数，期望 number 或 Float 类型');
            }

            if (x instanceof Float || y instanceof Float)
            {
                this.toGLSL = () => `vec2(${typeof x === 'number' ? formatNumber(x) : x.toGLSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toGLSL()})`;
                this.toWGSL = () => `vec2<f32>(${typeof x === 'number' ? formatNumber(x) : x.toWGSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toWGSL()})`;
                this.dependencies = [x, y].filter((arg): arg is Float => arg instanceof Float);
            }
            else
            {
                // 如果两个参数相同，使用单个参数形式
                if (x === y)
                {
                    this.toGLSL = () => `vec2(${formatNumber(x as number)})`;
                    this.toWGSL = () => `vec2<f32>(${formatNumber(x as number)})`;
                }
                else
                {
                    this.toGLSL = () => `vec2(${formatNumber(x as number)}, ${formatNumber(y as number)})`;
                    this.toWGSL = () => `vec2<f32>(${formatNumber(x as number)}, ${formatNumber(y as number)})`;
                }
                this.dependencies = [];
            }
        }
        else
        {
            throw new Error('Vec2 构造函数：无效的参数');
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
     * 乘法运算
     */
    multiply(other: Vec2 | Float | number): Vec2
    {
        const result = new Vec2(0, 0);
        if (other instanceof Vec2)
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Vec2): Vec2
    {
        const result = new Vec2(0, 0);
        result.toGLSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toGLSL());
            const right = formatOperand(other, '+', false, () => other.toGLSL());

            return `${left} + ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toWGSL());
            const right = formatOperand(other, '+', false, () => other.toWGSL());

            return `${left} + ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     */
    subtract(other: Vec2): Vec2
    {
        const result = new Vec2(0, 0);
        result.toGLSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toGLSL());
            const right = formatOperand(other, '-', false, () => other.toGLSL());

            return `${left} - ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toWGSL());
            const right = formatOperand(other, '-', false, () => other.toWGSL());

            return `${left} - ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Vec2 | Float | number): Vec2
    {
        const result = new Vec2(0, 0);
        if (other instanceof Vec2)
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

}

/**
 * vec2 构造函数
 */
export function vec2(uniform: Uniform): Vec2;
export function vec2(attribute: Attribute): Vec2;
export function vec2(varying: Varying): Vec2;
export function vec2(builtin: Builtin): Vec2;
export function vec2(x: number | Float, y: number | Float): Vec2;
export function vec2(...args: any[]): Vec2
{
    return new (Vec2 as any)(...args);
}
