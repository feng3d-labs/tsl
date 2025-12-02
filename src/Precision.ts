import { IElement } from './IElement';
import { getCurrentFunc } from './currentFunc';

/**
 * Precision 类型
 */
export type PrecisionType = 'float' | 'int' | 'sampler2DArray';

/**
 * Precision 类，表示 GLSL 精度声明（仅用于 fragment shader）
 */
export class Precision implements IElement
{
    readonly value: 'lowp' | 'mediump' | 'highp';
    readonly type: PrecisionType;
    dependencies: IElement[] = [];

    constructor(value: 'lowp' | 'mediump' | 'highp', type: PrecisionType = 'float')
    {
        this.value = value;
        this.type = type;
    }

    toGLSL(): string
    {
        return `precision ${this.value} ${this.type};`;
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
 * @param type 类型：'float' | 'int' | 'sampler2DArray'（默认为 'float'）
 * @returns Precision 实例
 */
export function precision(value: 'lowp' | 'mediump' | 'highp', type?: PrecisionType): Precision;
export function precision(value: 'lowp' | 'mediump' | 'highp', type: PrecisionType = 'float'): Precision
{
    const precisionInstance = new Precision(value, type);

    // 如果当前正在执行函数，将 precision 添加到依赖中
    const currentFunc = getCurrentFunc();
    if (!currentFunc)
    {
        throw new Error('precision() 必须在 fragment shader 函数中调用');
    }
    currentFunc.dependencies.push(precisionInstance);

    return precisionInstance;
}

