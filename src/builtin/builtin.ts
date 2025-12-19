import { IElement, ShaderValue } from '../IElement';

/**
 * 将下划线命名转换为驼峰命名
 * @param name 下划线命名，如 "vertex_index"
 * @returns 驼峰命名，如 "vertexIndex"
 */
function toCamelCase(name: string): string
{
    return name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

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

    constructor(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing' | 'vertexIndex' | 'gl_VertexID' | 'fragCoord' | 'gl_FragCoord' | 'instance_index' | 'gl_InstanceID' | 'gl_FragColor')
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
        if (this.builtinName === 'gl_InstanceID') return 'instance_index';
        if (this.builtinName === 'instance_index') return 'instance_index';

        return this.builtinName;
    }

    /**
     * 获取默认的变量名（驼峰命名格式）
     * 注意：gl_FragCoord 使用 fragCoord 而不是 position，以区分顶点着色器的 position 输出
     */
    get defaultName(): string
    {
        // gl_FragCoord/fragCoord 特殊处理，使用 fragCoord 作为变量名
        if (this.isFragCoord)
        {
            return 'fragCoord';
        }

        // gl_FragColor 使用 fragColor 作为变量名
        if (this.isFragColorOutput)
        {
            return 'fragColor';
        }

        return toCamelCase(this.wgslBuiltinName);
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

    /**
     * 检查是否是 instanceIndex 相关的 builtin
     */
    get isInstanceIndex(): boolean
    {
        return this.builtinName === 'instance_index' || this.builtinName === 'gl_InstanceID';
    }

    /**
     * 检查是否是 gl_FragColor（片段着色器输出颜色）
     */
    get isFragColorOutput(): boolean
    {
        return this.builtinName === 'gl_FragColor';
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
        if (this.isInstanceIndex)
        {
            return 'gl_InstanceID';
        }
        if (this.isFragColorOutput)
        {
            return 'gl_FragColor';
        }

        throw new Error(`Builtin '${this.builtinName}' 不支持 GLSL，无法生成 GLSL 代码。`);
    }

    toWGSL(): string
    {
        // gl_FragColor 不是 WGSL builtin，直接返回变量名
        if (this.isFragColorOutput)
        {
            return this.name ?? this.defaultName;
        }

        // 对于特定的 builtin，强制使用正确的 WGSL 类型
        // 这些类型是 WGSL 规范要求的，不能由用户代码改变
        let wgslType: string;
        if (this.isFrontFacing)
        {
            wgslType = 'bool';
        }
        else if (this.isVertexIndex || this.isInstanceIndex)
        {
            wgslType = 'u32';
        }
        else if (this.isFragCoord || this.isPosition)
        {
            wgslType = 'vec4<f32>';
        }
        else
        {
            // 对于其他 builtin，使用 value 的类型
            if (!this.value)
            {
                throw new Error(`Builtin '${this.builtinName}' 的 value 没有设置，无法生成 WGSL。`);
            }
            wgslType = this.value.wgslType ?? 'vec4<f32>';
        }

        // 如果没有设置 name，使用默认名称
        const varName = this.name ?? this.defaultName;

        return `@builtin(${this.wgslBuiltinName}) ${varName}: ${wgslType}`;
    }
}

/**
 * 创建内置变量引用
 * 只能在 varyingStruct 中使用，变量名从结构体字段名获取
 * @param builtinName WGSL 中内置的固定名称（如 'position' 或 'gl_Position'，两者等价；或 'front_facing' 或 'gl_FrontFacing'，两者等价）
 * @returns Builtin 实例
 */
export function builtin(builtinName: 'position' | 'gl_Position' | 'front_facing' | 'gl_FrontFacing' | 'vertexIndex' | 'gl_VertexID' | 'fragCoord' | 'gl_FragCoord' | 'instance_index' | 'gl_InstanceID' | 'gl_FragColor'): Builtin
{
    return new Builtin(builtinName);
}
