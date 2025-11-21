import { IElement } from '../IElement';
import { Uniform } from '../Uniform';

export class Mat4 implements IElement
{
    readonly glslType = 'mat4';
    readonly wgslType = 'mat4x4<f32>';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(uniform: Uniform)
    {
        this.dependencies = [uniform];

        this.toGLSL = () => uniform.name;
        this.toWGSL = () => uniform.name;

        uniform.value = this;
    }
}

/**
 * mat4 构造函数
 * 如果传入单个 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
 */
export function mat4(uniform: Uniform): Mat4
{
    return new Mat4(uniform);
}

