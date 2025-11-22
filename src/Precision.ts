import { getCurrentShaderInstance } from './currentShaderInstance';

/**
 * 设置 GLSL 精度（仅用于 fragment shader）
 * @param value 精度：'lowp' | 'mediump' | 'highp'
 */
export function precision(value: 'lowp' | 'mediump' | 'highp'): void
{
    // 如果当前正在构造 Shader 实例，设置 precision
    const currentShaderInstance = getCurrentShaderInstance();
    currentShaderInstance.precision = value;
}

