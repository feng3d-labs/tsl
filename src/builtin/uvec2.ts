import { IElement, IType } from '../IElement';
import { Uniform } from '../Uniform';
import { FunctionCallConfig } from './vec4';

export class Uvec2 implements IType
{
    readonly glslType = 'uvec2';
    readonly wgslType = 'uvec2<u32>';
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
 * uvec2 构造函数
 */
export function uvec2(...args: (string | number | FunctionCallConfig)[]): FunctionCallConfig
{
    return {
        function: 'uvec2',
        args: args.map(arg => (typeof arg === 'object' && arg !== null && 'name' in arg) ? (arg as { name: string }).name : arg) as (string | number | FunctionCallConfig)[],
        typeParam: 'u32',
    };
}


