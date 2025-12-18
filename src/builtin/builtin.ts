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

    constructor(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing' | 'vertexIndex' | 'gl_VertexID' | 'fragCoord' | 'gl_FragCoord' | 'instance_index' | 'gl_InstanceID')
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
        if (this.builtinName === 'gl_VertexID') return 'vertex_index';
        if (this.builtinName === 'vertexIndex') return 'vertex_index';
        if (this.builtinName === 'gl_FragCoord') return 'position';
        if (this.builtinName === 'fragCoord') return 'position';
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

    /**
     * 检查是否是 vertexIndex 相关的 builtin
     */
    get isVertexIndex(): boolean
    {
        return this.builtinName === 'vertexIndex' || this.builtinName === 'gl_VertexID';
    }

    /**
     * 检查是否是 fragCoord 相关的 builtin
     */
    get isFragCoord(): boolean
    {
        return this.builtinName === 'fragCoord' || this.builtinName === 'gl_FragCoord';
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
        if (this.isVertexIndex)
        {
            return 'gl_VertexID';
        }
        if (this.isFragCoord)
        {
            return 'gl_FragCoord';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        // 如果没有设置value，抛出错误
        if (!this.value)
        {
            throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置 wgslType，无法生成 WGSL。`);
        }
        
        let wgslType = this.value.wgslType;
        if (!wgslType)
        {
            if (this.isFrontFacing) wgslType = 'bool';
            else if (this.isVertexIndex) wgslType = 'u32';
            else if (this.isFragCoord) wgslType = 'vec4f';
            else wgslType = 'vec4f';
        }
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
export function builtin(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing' | 'vertexIndex' | 'gl_VertexID' | 'fragCoord' | 'gl_FragCoord' | 'instance_index' | 'gl_InstanceID'): Builtin
{
    return new Builtin(builtinName);
}

