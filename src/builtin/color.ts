import { IElement, ShaderValue } from '../IElement';

/**
 * Color 类，表示 fragment shader 的输出 location
 * @internal 库外部不应直接使用 `new Color()`，应使用 `color()` 函数
 */
export class Color implements IElement
{
    readonly location: number;
    dependencies: IElement[] = [];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(location: number)
    {
        this.location = location;
        this.toGLSL = () => `color${location}`;
        this.toWGSL = () => `color${location}`;
    }
}

/**
 * 创建 fragment shader 输出 location
 * @param location 输出 location（0, 1, 2, ...）
 * @returns Color 实例
 */
export function color(location: number): Color
{
    return new Color(location);
}

