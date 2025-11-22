import { IElement } from './IElement';
import { getCurrentFunc } from './currentFunc';

/**
 * Precision 标记
 */
export const PRECISION_SYMBOL = Symbol('precision');

/**
 * Precision 类，表示 GLSL 精度声明（仅用于 fragment shader）
 */
export class Precision implements IElement
{
    readonly __type__ = PRECISION_SYMBOL;
    readonly value: 'lowp' | 'mediump' | 'highp';
    dependencies: IElement[] = [];

    constructor(value: 'lowp' | 'mediump' | 'highp')
    {
        this.value = value;
    }

    toGLSL(): string
    {
        return `precision ${this.value} float;`;
    }

    toWGSL(): string
    {
        // WGSL 不需要 precision 声明
        return '';
    }
}

/**
 * 设置 GLSL 精度（仅用于 fragment shader）
 * @param value 精度：'lowp' | 'mediump' | 'highp'
 * @returns Precision 实例
 */
export function precision(value: 'lowp' | 'mediump' | 'highp'): Precision
{
    const precisionInstance = new Precision(value);

    // 如果当前正在执行函数，将 precision 添加到依赖中
    const currentFunc = getCurrentFunc();
    if (!currentFunc)
    {
        throw new Error('precision() 必须在 fragment shader 函数中调用');
    }
    currentFunc.dependencies.push(precisionInstance);

    return precisionInstance;
}

