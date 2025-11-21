import { IShader } from './IShader';

/**
 * 当前正在构造的 Shader 实例（用于自动收集）
 * @internal
 */
let currentShaderInstance: IShader | null = null;

/**
 * 设置当前正在构造的 Shader 实例
 * @internal
 */
export function setCurrentShaderInstance(instance: IShader): void
{
    currentShaderInstance = instance;
}

/**
 * 清除当前正在构造的 Shader 实例
 * @internal
 */
export function clearCurrentShaderInstance(): void
{
    currentShaderInstance = null;
}

/**
 * 获取当前正在构造的 Shader 实例
 * @internal
 */
export function getCurrentShaderInstance(): IShader | null
{
    return currentShaderInstance;
}

