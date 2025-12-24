import { analyzeDependencies, AnalyzedDependencies } from '../core/analyzeDependencies';
import { buildShader } from '../core/buildShader';
import { IStatement } from '../core/Statement';
import { setCurrentFunc } from '../core/currentFunc';
import { IElement, ShaderValue } from '../core/IElement';

/**
 * 参数信息
 */
interface ParamInfo
{
    name: string;
    glslType: string;
    wgslType: string;
    value: ShaderValue;
}

/**
 * Func 类
 */
export class Func
{
    readonly name: string;
    readonly body: () => any;
    statements: IStatement[] = [];
    dependencies: IElement[] = [];
    private _analyzedDependencies?: AnalyzedDependencies;

    constructor(name: string, body: () => any)
    {
        this.name = name;
        this.body = body;
    }

    /**
     * 执行函数体并收集语句和依赖（如果尚未收集）
     */
    protected executeBodyIfNeeded(): void
    {
        // 如果已经有依赖，说明已经执行过 body，不需要重复执行
        if (this.dependencies.length > 0 || this.statements.length > 0)
        {
            return;
        }

        // 设置当前函数，以便 _let 和 _return 可以收集语句和依赖
        setCurrentFunc(this);

        try
        {
            this.body();
        }
        finally
        {
            // 清除当前函数引用
            setCurrentFunc(null);
        }
    }

    /**
     * 获取分析后的依赖（只分析一次，后续使用缓存）
     */
    public getAnalyzedDependencies(): AnalyzedDependencies
    {
        if (!this._analyzedDependencies)
        {
            // 确保依赖已收集
            this.executeBodyIfNeeded();
            this._analyzedDependencies = analyzeDependencies(this.dependencies);
        }

        return this._analyzedDependencies;
    }

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成函数签名
        lines.push(`void ${this.name}() {`);

        this.statements.forEach((stmt) =>
        {
            const glsl = stmt.toGLSL();
            // 过滤掉空语句
            if (glsl.trim() !== '')
            {
                // 处理多行语句，为每行添加缩进
                const stmtLines = glsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
            }
        });

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 转换为 WGSL 代码（基础实现，生成简单的函数体）
     * 子类（Vertex、Fragment）应覆盖此方法以处理各自特有的逻辑
     */
    toWGSL(): string
    {
        // 执行函数体收集语句和依赖（如果尚未收集）
        this.executeBodyIfNeeded();

        const lines: string[] = [];

        // 生成简单的函数签名（子类应覆盖以生成正确的签名）
        lines.push(`fn ${this.name}() {`);

        // 生成函数体语句
        this.statements.forEach((stmt) =>
        {
            const wgsl = stmt.toWGSL();
            // 处理多行语句，为每行添加缩进
            const stmtLines = wgsl.split('\n');
            for (const line of stmtLines)
            {
                lines.push(`    ${line}`);
            }
        });

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 生成 WGSL 函数体语句（供子类使用）
     * @returns 函数体语句数组，每行已添加缩进
     */
    protected generateWGSLStatements(): string[]
    {
        const lines: string[] = [];
        this.statements.forEach((stmt) =>
        {
            const wgsl = stmt.toWGSL();
            const stmtLines = wgsl.split('\n');
            for (const line of stmtLines)
            {
                lines.push(`    ${line}`);
            }
        });

        return lines;
    }

}

/**
 * 参数定义类型：可以是类型构造函数，或 [名称, 类型构造函数] 元组
 */
type ParamDef = ((...args: any[]) => ShaderValue) | [string, (...args: any[]) => ShaderValue];

/**
 * ShaderFunc 类 - 表示一个可调用的着色器函数
 * 支持参数和返回值
 */
export class ShaderFunc<TParams extends ShaderValue[], TReturn extends ShaderValue>
{
    readonly name: string;
    readonly params: ParamInfo[];
    readonly returnType: { glslType: string; wgslType: string };
    readonly statements: IStatement[] = [];
    readonly dependencies: IElement[] = [];

    private _glslCode?: string;
    private _wgslCode?: string;

    constructor(
        name: string,
        paramDefs: ParamDef[],
        returnTypeFunc: (...args: any[]) => TReturn,
        body: (...params: TParams) => void,
    )
    {
        this.name = name;

        // 获取返回类型信息
        const returnSample = returnTypeFunc();
        this.returnType = {
            glslType: returnSample.glslType,
            wgslType: returnSample.wgslType,
        };

        // 从数组创建参数，支持两种格式：
        // 1. 类型构造函数：vec3 -> 参数名自动生成为 p0, p1, ...
        // 2. [名称, 类型构造函数]：['colorRGB', vec3] -> 使用指定的参数名
        this.params = paramDefs.map((def, index) =>
        {
            const isNamedParam = Array.isArray(def);
            const paramName = isNamedParam ? def[0] : `p${index}`;
            const typeFunc = isNamedParam ? def[1] : def;

            const sample = typeFunc();
            const paramValue = typeFunc();

            // 设置参数的 toGLSL 和 toWGSL 返回参数名
            paramValue.toGLSL = () => paramName;
            paramValue.toWGSL = () => paramName;

            return {
                name: paramName,
                glslType: sample.glslType,
                wgslType: sample.wgslType,
                value: paramValue,
            };
        });

        // 执行函数体收集语句
        const tempFunc = new Func(name, () =>
        {
            const paramValues = this.params.map((p) => p.value) as unknown as TParams;
            body(...paramValues);
        });

        // 执行收集
        setCurrentFunc(tempFunc);
        try
        {
            const paramValues = this.params.map((p) => p.value) as unknown as TParams;
            body(...paramValues);

            // 复制收集到的语句和依赖
            this.statements.push(...tempFunc.statements);
            this.dependencies.push(...tempFunc.dependencies);
        }
        finally
        {
            setCurrentFunc(null);
        }
    }

    /**
     * 调用此函数，返回一个表达式
     */
    call(...args: { [K in keyof TParams]: TParams[K] | number }): TReturn
    {
        const argExpressions = args.map((arg) =>
        {
            if (typeof arg === 'number')
            {
                // 格式化数字为浮点数（保持 .0 后缀）
                const numStr = Number.isInteger(arg) ? `${arg}.0` : arg.toString();

                return { toGLSL: () => numStr, toWGSL: () => numStr };
            }

            return arg as ShaderValue;
        });

        // 创建函数调用表达式（使用简单对象而不是调用构造函数）
        const result: ShaderValue = {
            glslType: this.returnType.glslType,
            wgslType: this.returnType.wgslType,
            toGLSL: () => `${this.name}(${argExpressions.map((a) => a.toGLSL()).join(', ')})`,
            toWGSL: () => `${this.name}(${argExpressions.map((a) => a.toWGSL()).join(', ')})`,
            dependencies: argExpressions as IElement[],
        };

        // 标记需要此函数定义
        (result as any)._shaderFunc = this;

        return result as TReturn;
    }

    /**
     * 生成 GLSL 函数定义
     */
    toGLSL(): string
    {
        if (this._glslCode) return this._glslCode;

        // 使用 buildShader 上下文来确保 return_ 等语句能正确生成
        // isHelperFunction: true 表示这是辅助函数，return_ 应该生成普通的 return 语句
        this._glslCode = buildShader({ language: 'glsl', stage: 'fragment', version: 2, isHelperFunction: true }, () =>
        {
            const lines: string[] = [];

            // 生成函数签名
            const paramStr = this.params.map((p) => `in ${p.glslType} ${p.name}`).join(', ');
            lines.push(`${this.returnType.glslType} ${this.name}(${paramStr}) {`);

            // 生成函数体
            for (const stmt of this.statements)
            {
                const code = stmt.toGLSL();
                if (code.trim())
                {
                    for (const line of code.split('\n'))
                    {
                        lines.push(`    ${line}`);
                    }
                }
            }

            lines.push('}');

            return lines.join('\n');
        });

        return this._glslCode;
    }

    /**
     * 生成 WGSL 函数定义
     */
    toWGSL(): string
    {
        if (this._wgslCode) return this._wgslCode;

        // 使用 buildShader 上下文来确保 return_ 等语句能正确生成
        // isHelperFunction: true 表示这是辅助函数，return_ 应该生成普通的 return 语句
        this._wgslCode = buildShader({ language: 'wgsl', stage: 'fragment', version: 1, isHelperFunction: true }, () =>
        {
            const lines: string[] = [];

            // 生成函数签名
            const paramStr = this.params.map((p) => `${p.name}: ${p.wgslType}`).join(', ');
            lines.push(`fn ${this.name}(${paramStr}) -> ${this.returnType.wgslType} {`);

            // 生成函数体
            for (const stmt of this.statements)
            {
                const code = stmt.toWGSL();
                if (code.trim())
                {
                    for (const line of code.split('\n'))
                    {
                        lines.push(`    ${line}`);
                    }
                }
            }

            lines.push('}');

            return lines.join('\n');
        });

        return this._wgslCode;
    }
}

// 类型辅助：从类型构造函数数组推导参数类型（支持两种格式）
type ParamTypesFromDefs<T extends ParamDef[]> = {
    [K in keyof T]: T[K] extends [string, (...args: any[]) => infer R]
        ? R
        : T[K] extends (...args: any[]) => infer R
            ? R
            : never;
};

// 类型辅助：将参数类型转换为可接受 number 的版本
type ParamTypesWithNumber<T extends ShaderValue[]> = {
    [K in keyof T]: T[K] | number;
};

/**
 * 定义着色器函数
 * @param name 函数名
 * @param paramDefs 参数定义数组，支持两种格式：
 *   - 类型构造函数：[vec3, float] -> 参数名自动生成为 p0, p1, ...
 *   - 带名称的元组：[['colorRGB', vec3], ['gammaCorrection', float]] -> 使用指定的参数名
 * @param returnType 返回类型，如 vec3
 * @param body 函数体，接收参数并返回结果（使用 return_ 表达返回值）
 * @returns 可调用的着色器函数
 *
 * @example
 * ```typescript
 * // 使用自动参数名
 * const rgbToSrgb = func('rgbToSrgb', [vec3, float], vec3, (colorRGB, gammaCorrection) => {
 *     // ...
 * });
 *
 * // 使用指定参数名（与 GLSL 一致）
 * const rgbToSrgb = func('rgbToSrgb', [['colorRGB', vec3], ['gammaCorrection', float]], vec3, (colorRGB, gammaCorrection) => {
 *     // ...
 * });
 *
 * // 调用
 * const result = rgbToSrgb(someColor, 0.41666);
 * ```
 */
export function func<
    TParamDefs extends ParamDef[],
    TReturn extends ShaderValue,
>(
    name: string,
    paramDefs: [...TParamDefs],
    returnType: (...args: any[]) => TReturn,
    body: (...params: ParamTypesFromDefs<TParamDefs>) => void,
): (...args: ParamTypesWithNumber<ParamTypesFromDefs<TParamDefs>>) => TReturn
{
    const shaderFunc = new ShaderFunc<ParamTypesFromDefs<TParamDefs>, TReturn>(
        name,
        paramDefs,
        returnType,
        body as any,
    );

    // 返回一个可调用的函数
    const callable = (...args: any[]) => shaderFunc.call(...(args as any));

    // 附加 ShaderFunc 实例以便获取函数定义
    (callable as any)._shaderFunc = shaderFunc;

    return callable as any;
}
