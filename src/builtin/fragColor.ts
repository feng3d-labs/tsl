import { IElement } from '../IElement';

/**
 * FragColor 类，表示 fragment shader 的输出 location
 * @internal 库外部不应直接使用 `new FragColor()`，应使用 `fragColor()` 函数
 */
export class FragColor implements IElement
{
    readonly location: number;
    dependencies: IElement[] = [];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(location: number)
    {
        this.location = location;
        this.toGLSL = () => `fragColor${location}`;
        this.toWGSL = () => `fragColor${location}`;
    }
}

/**
 * 创建 fragment shader 输出 location
 * @param location 输出 location（0, 1, 2, ...）
 * @returns FragColor 实例
 */
export function fragColor(location: number): FragColor
{
    return new FragColor(location);
}
