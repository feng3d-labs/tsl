import { buildShader } from '../core/buildShader';
import { Builtin } from '../glsl/builtin/builtin';
import { Varying } from '../variables/varying';
import { Vertex } from './vertex';

/**
 * Transform 类，包装 Vertex 用于 Transform Feedback
 *
 * 专门用于 Transform Feedback 着色器，其 toWGSL 方法生成计算着色器代码。
 */
export class Transform
{
    private vertex: Vertex;

    constructor(name: string, body: () => void)
    {
        this.vertex = new Vertex(name, body);
    }

    /**
     * 获取着色器函数名称
     */
    get name(): string
    {
        return this.vertex.name;
    }

    /**
     * 获取函数体语句
     */
    get statements()
    {
        return this.vertex.statements;
    }

    /**
     * 转换为 GLSL 顶点着色器代码（WebGL2）
     *
     * Transform Feedback 仅支持 WebGL2，因此始终生成 GLSL ES 3.0 代码。
     *
     * @returns 完整的 GLSL 代码
     */
    toGLSL(): string
    {
        return this.vertex.toGLSL(2);
    }

    /**
     * 转换为 WGSL 计算着色器代码（用于 WebGPU 模拟 Transform Feedback）
     *
     * 自动从着色器中推断输出变量（gl_Position + 所有 varying）
     *
     * @param options 可选配置
     * @param options.bufferMode 缓冲区模式：'INTERLEAVED_ATTRIBS'（交错）或 'SEPARATE_ATTRIBS'（分离），默认为 'INTERLEAVED_ATTRIBS'
     * @returns 完整的 WGSL 计算着色器代码
     *
     * @example
     * ```typescript
     * // 交错模式（默认）
     * const computeWgsl = transformShader.toWGSL();
     *
     * // 分离模式
     * const computeWgsl = transformShader.toWGSL({ bufferMode: 'SEPARATE_ATTRIBS' });
     * ```
     */
    toWGSL(options?: { bufferMode?: 'INTERLEAVED_ATTRIBS' | 'SEPARATE_ATTRIBS' }): string
    {
        const workgroupSize = 64;
        const bufferMode = options?.bufferMode ?? 'INTERLEAVED_ATTRIBS';
        const isSeparate = bufferMode === 'SEPARATE_ATTRIBS';

        return buildShader({ language: 'wgsl', stage: 'compute', version: 1 }, () =>
        {
            const lines: string[] = [];

            // 执行 body 收集依赖
            this.vertex['executeBodyIfNeeded']();

            // 从函数的 dependencies 中分析获取 attributes、uniforms（使用缓存）
            const dependencies = this.vertex.getAnalyzedDependencies();

            // 自动分配 location（对于 location 缺省的 attribute）
            this.vertex['allocateLocations'](dependencies.attributes);

            // 收集需要作为输入的 attributes
            const inputAttributes = globalThis.Array.from(dependencies.attributes);

            // 自动从着色器依赖中推断输出（gl_Position + 所有 varyings）
            const outputBuiltins: Builtin[] = [];
            const positionBuiltin = globalThis.Array.from(dependencies.builtins).find((b) => b.isPosition);
            if (positionBuiltin)
            {
                outputBuiltins.push(positionBuiltin);
            }
            const outputVaryings: Varying[] = globalThis.Array.from(dependencies.varyings);

            // 生成输入结构体
            lines.push('struct VertexInput {');
            for (const attr of inputAttributes)
            {
                const wgslType = attr.value?.wgslType ?? 'vec4<f32>';
                lines.push(`    ${attr.name}: ${wgslType},`);
            }
            lines.push('}');
            lines.push('');

            if (!isSeparate)
            {
                // 交错模式：生成单一输出结构体
                lines.push('struct VertexOutput {');
                for (const builtin of outputBuiltins)
                {
                    lines.push('    position: vec4<f32>,');
                }
                for (const varying of outputVaryings)
                {
                    const wgslType = varying.value?.wgslType ?? 'vec4<f32>';
                    lines.push(`    ${varying.name}: ${wgslType},`);
                }
                lines.push('}');
                lines.push('');
            }

            // 收集结构体 uniform 的名称
            const structUniformNames = new Set(dependencies.structUniforms.map((s) => s.uniform.name));

            // 自动分配 binding（从 0 开始，为 input 和 output 缓冲区预留位置）
            let nextBinding = 0;

            // 生成 uniforms
            for (const uniform of dependencies.uniforms)
            {
                if (!structUniformNames.has(uniform.name))
                {
                    const effectiveGroup = uniform.getEffectiveGroup();
                    lines.push(`@group(${effectiveGroup}) @binding(${nextBinding}) var<uniform> ${uniform.name}: ${uniform.value?.wgslType ?? 'mat4x4<f32>'};`);
                    nextBinding++;
                }
            }

            // 生成结构体 uniform
            for (const structInfo of dependencies.structUniforms)
            {
                const effectiveGroup = structInfo.uniform.getEffectiveGroup();
                lines.push(structInfo.structDef.toWGSLUniform(structInfo.instanceName, effectiveGroup, nextBinding));
                nextBinding++;
            }

            // 生成输入存储缓冲区
            lines.push(`@group(0) @binding(${nextBinding}) var<storage, read> inputData: array<VertexInput>;`);
            nextBinding++;

            if (isSeparate)
            {
                // 分离模式：为每个输出生成独立的缓冲区
                for (const builtin of outputBuiltins)
                {
                    lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData_gl_Position: array<vec4<f32>>;`);
                    nextBinding++;
                }
                for (const varying of outputVaryings)
                {
                    const wgslType = varying.value?.wgslType ?? 'vec4<f32>';
                    lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData_${varying.name}: array<${wgslType}>;`);
                    nextBinding++;
                }
            }
            else
            {
                // 交错模式：生成单一输出缓冲区
                lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData: array<VertexOutput>;`);
                nextBinding++;
            }

            lines.push('');

            // 生成计算着色器入口函数
            lines.push(`@compute @workgroup_size(${workgroupSize})`);
            lines.push(`fn ${this.name}(@builtin(global_invocation_id) global_id: vec3<u32>) {`);
            lines.push('    let idx = global_id.x;');
            lines.push('    let input = inputData[idx];');

            if (!isSeparate)
            {
                lines.push('    var output: VertexOutput;');
            }
            lines.push('');

            // 设置 attribute 的 toWGSL 返回 input.attrName 格式
            for (const attr of inputAttributes)
            {
                if (attr.value)
                {
                    const attrName = attr.name;
                    attr.value.toWGSL = () => `input.${attrName}`;
                }
            }

            // 设置 varying 的 toWGSL 返回对应格式
            for (const varying of outputVaryings)
            {
                if (varying.value)
                {
                    const varyingName = varying.name;
                    if (isSeparate)
                    {
                        varying.value.toWGSL = () => `outputData_${varyingName}[idx]`;
                    }
                    else
                    {
                        varying.value.toWGSL = () => `output.${varyingName}`;
                    }
                }
            }

            // 设置 position builtin 的 toWGSL 返回对应格式
            for (const builtin of outputBuiltins)
            {
                if (builtin.isPosition && builtin.value)
                {
                    if (isSeparate)
                    {
                        builtin.value.toWGSL = () => 'outputData_gl_Position[idx]';
                    }
                    else
                    {
                        builtin.value.toWGSL = () => 'output.position';
                    }
                }
            }

            // 生成函数体语句（跳过 precision 等不需要的语句）
            for (const stmt of this.statements)
            {
                const wgsl = stmt.toWGSL();
                // 跳过空语句和 precision 语句
                if (wgsl.trim() === '' || wgsl.includes('precision'))
                {
                    continue;
                }
                // 跳过自动生成的语句
                if ((stmt as any)._isAutoVarDeclaration || (stmt as any)._isAutoReturn || (stmt as any)._isAutoDepthConvert)
                {
                    continue;
                }
                const stmtLines = wgsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
            }

            if (!isSeparate)
            {
                // 交错模式：将输出写入单一缓冲区
                lines.push('');
                lines.push('    outputData[idx] = output;');
            }

            lines.push('}');

            return lines.join('\n') + '\n';
        });
    }
}

/**
 * 创建一个 Transform Feedback 着色器
 *
 * @param name 着色器函数名
 * @param body 着色器函数体
 * @returns Transform 对象
 *
 * @example
 * ```typescript
 * const transformShader = transform('main', () => {
 *     gl_Position.assign(MVP.multiply(position));
 *     v_color.assign(vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0));
 * });
 *
 * // 生成 GLSL 顶点着色器（WebGL2）
 * const glsl = transformShader.toGLSL();
 *
 * // 生成 WGSL 计算着色器（WebGPU）
 * const wgsl = transformShader.toWGSL();
 *
 * // 分离模式
 * const wgslSeparate = transformShader.toWGSL({ bufferMode: 'SEPARATE_ATTRIBS' });
 * ```
 */
export function transform(name: string, body: () => void): Transform
{
    return new Transform(name, body);
}
