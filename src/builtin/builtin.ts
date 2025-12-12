import { IElement, ShaderValue } from '../IElement';

/**
 * Builtin 类，表示内置变量（如 position）
 * 只能在 varyingStruct 中使用，变量名从结构体字段名获取
 * @internal 库外部不应直接使用 `new Builtin()`，应使用 `builtin()` 函数
 */
export class Builtin implements IElement
{
    readonly builtinName: string; // WGSL 中内置的固定名称（如 "position" 或 "gl_Position"）
    name?: string; // 变量名称（从结构体字段名获取，在 varyingStruct 中设置）
    value: ShaderValue;
    dependencies: IElement[] = [];

    constructor(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing')
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
     * 获取 WGSL 中的 builtin 名称（将 gl_Position 映射为 position，gl_FrontFacing 映射为 front_facing）
     */
    get wgslBuiltinName(): string
    {
        if (this.builtinName === 'gl_Position') return 'position';
        if (this.builtinName === 'gl_FrontFacing') return 'front_facing';
        return this.builtinName;
    }

    /**
     * 检查是否是 position 相关的 builtin
     */
    get isPosition(): boolean
    {
        return this.builtinName === 'position' || this.builtinName === 'gl_Position';
    }

    /**
     * 检查是否是 front_facing 相关的 builtin
     */
    get isFrontFacing(): boolean
    {
        return this.builtinName === 'front_facing' || this.builtinName === 'gl_FrontFacing';
    }

    toGLSL(): string
    {
        if (this.isPosition)
        {
            return 'gl_Position';
        }
        if (this.isFrontFacing)
        {
            return 'gl_FrontFacing';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        const wgslType = this.value?.wgslType || (this.isFrontFacing ? 'bool' : undefined);
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
 * @param builtinName WGSL 中内置的固定名称（如 'position' 或 'gl_Position'，两者等价；或 'front_facing' 或 'gl_FrontFacing'，两者等价）
 * @returns Builtin 实例
 */
export function builtin(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing'): Builtin
{
    return new Builtin(builtinName);
}

