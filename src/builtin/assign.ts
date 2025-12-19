import { ShaderValue } from '../IElement';
import { getBuildParam } from '../buildShader';
import { getCurrentFunc } from '../currentFunc';
import { getCurrentIfStatement } from '../ifStack';
import { Builtin } from './builtin';
import { IStatement } from './Statement';

/**
 * Assign 类，表示赋值语句
 * @internal 库外部不应直接使用 `new Assign()`，应使用 `assign()` 函数
 */
export class Assign implements IStatement
{
    readonly target: ShaderValue;
    readonly value: ShaderValue;

    constructor(target: ShaderValue, value: ShaderValue)
    {
        this.target = target;
        this.value = value;

        // 将语句添加到当前函数的 statements 中，或当前 if 语句的 statements 中
        const currentFunc = getCurrentFunc();
        if (currentFunc)
        {
            // 检查当前是否在if语句体中
            const currentIfStatement = getCurrentIfStatement();
            if (currentIfStatement)
            {
                // 如果当前在if语句体中，将语句添加到当前if语句的statements中
                currentIfStatement.statements.push(this);
            }
            else
            {
                // 否则将语句添加到当前函数的statements中
                currentFunc.statements.push(this);
            }
            // 收集依赖（包括 target 和 value）
            currentFunc.dependencies.push(target);
            currentFunc.dependencies.push(value);
        }
    }

    toGLSL(): string
    {
        return `${this.target.toGLSL()} = ${this.value.toGLSL()};`;
    }

    toWGSL(): string
    {
        const buildParam = getBuildParam();

        // 检测是否是 position builtin（直接或通过 VaryingStruct 包装）
        let isPositionBuiltin = false;
        if (this.target instanceof Builtin && this.target.isPosition)
        {
            isPositionBuiltin = true;
        }
        else if (this.target && 'dependencies' in this.target && Array.isArray(this.target.dependencies))
        {
            // 检查 dependencies[0] 是否是 position builtin（用于 VaryingStruct 字段）
            const dep = this.target.dependencies[0];
            if (dep instanceof Builtin && dep.isPosition)
            {
                isPositionBuiltin = true;
            }
        }

        // 检测是否是 gl_FragColor builtin（直接或通过 Vec4 包装）
        let isFragColorBuiltin = false;
        if (this.target instanceof Builtin && this.target.isFragColorOutput)
        {
            isFragColorBuiltin = true;
        }
        else if (this.target && 'dependencies' in this.target && Array.isArray(this.target.dependencies))
        {
            const dep = this.target.dependencies[0];
            if (dep instanceof Builtin && dep.isFragColorOutput)
            {
                isFragColorBuiltin = true;
            }
        }

        // 在 WGSL 中，如果是 fragment shader 的 gl_FragColor，需要特殊处理
        if (isFragColorBuiltin && buildParam.stage === 'fragment')
        {
            return `fragColor = ${this.value.toWGSL()};`;
        }

        // 在 WGSL 中，如果是 vertex shader 的 position，需要特殊处理
        if (isPositionBuiltin && buildParam.stage === 'vertex')
        {
            // 获取值的 WGSL 表示
            const valueWGSL = this.value.toWGSL();

            // 获取 position builtin 实例
            let positionBuiltin: Builtin | undefined;
            if (this.target instanceof Builtin && this.target.isPosition)
            {
                positionBuiltin = this.target;
            }
            else if (this.target && 'dependencies' in this.target && Array.isArray(this.target.dependencies))
            {
                const dep = this.target.dependencies[0];
                if (dep instanceof Builtin && dep.isPosition)
                {
                    positionBuiltin = dep;
                }
            }

            // 获取目标变量名
            // 如果 builtin 有结构体前缀（auto-generated VaryingStruct），使用 getFullWGSLVarName()（如 'v.position'）
            // 否则使用 target.toWGSL()
            const getTargetWGSL = (): string =>
            {
                if (positionBuiltin && positionBuiltin.hasStructVarPrefix())
                {
                    // builtin 通过 vertex.ts 自动设置了结构体前缀
                    return positionBuiltin.getFullWGSLVarName();
                }

                return this.target.toWGSL();
            };

            // 如果启用了深度转换，将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]
            if (buildParam.convertDepth)
            {
                // 公式: z_webgpu = (z_webgl + 1.0) * 0.5
                // 生成: vec4<f32>(pos.xy, (pos.z + 1.0) * 0.5, pos.w)
                // 使用临时变量避免重复计算
                const tempVar = '_pos_temp';
                const targetWGSL = getTargetWGSL();
                const depthConversion = `let ${tempVar} = ${valueWGSL}; ${targetWGSL} = vec4<f32>(${tempVar}.xy, (${tempVar}.z + 1.0) * 0.5, ${tempVar}.w);`;

                return depthConversion;
            }

            // 普通赋值
            return `${getTargetWGSL()} = ${valueWGSL};`;
        }
        else
        {
            return `${this.target.toWGSL()} = ${this.value.toWGSL()};`;
        }
    }
}

