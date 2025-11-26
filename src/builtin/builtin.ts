import { IElement, ShaderValue } from '../IElement';

/**
 * Builtin 类，表示内置变量（如 position）
 * 只能在 varyingStruct 中使用，变量名从结构体字段名获取
 */
export class Builtin implements IElement
{
    readonly builtinName: string; // WGSL 中内置的固定名称（如 "position" 或 "gl_Position"）
    name?: string; // 变量名称（从结构体字段名获取，在 varyingStruct 中设置）
    value: ShaderValue;
    dependencies: IElement[] = [];

    constructor(builtinName: 'position' | 'gl_Position')
    {
        this.builtinName = builtinName;
    }

    /**
     * 设置变量名（由 varyingStruct 调用）
     * @internal
     */
    setName(name: string): void
    {
        this.name = name;
    }

    /**
     * 获取 WGSL 中的 builtin 名称（将 gl_Position 映射为 position）
     */
    get wgslBuiltinName(): string
    {
        return this.builtinName === 'gl_Position' ? 'position' : this.builtinName;
    }

    /**
     * 检查是否是 position 相关的 builtin
     */
    get isPosition(): boolean
    {
        return this.builtinName === 'position' || this.builtinName === 'gl_Position';
    }

    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Builtin '${this.builtinName}' 没有设置 value，无法生成 GLSL。`);
        }
        if (this.isPosition)
        {
            return 'gl_Position';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        const wgslType = this.value?.wgslType;
        if (!wgslType)
        {
            throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置 wgslType，无法生成 WGSL。`);
        }
        if (!this.name)
        {
            throw new Error(`Builtin '${this.builtinName}' 没有设置 name，必须在 varyingStruct 中使用。`);
        }

        return `@builtin(${this.wgslBuiltinName}) ${this.name}: ${wgslType}`;
    }
}

/**
 * 创建内置变量引用
 * 只能在 varyingStruct 中使用，变量名从结构体字段名获取
 * @param builtinName WGSL 中内置的固定名称（如 'position' 或 'gl_Position'，两者等价）
 * @returns Builtin 实例
 */
export function builtin(builtinName: 'position' | 'gl_Position'): Builtin
{
    return new Builtin(builtinName);
}

