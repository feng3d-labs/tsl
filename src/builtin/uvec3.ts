import { FunctionCallConfig } from './vec4';

/**
 * uvec3 构造函数
 */
export function uvec3(...args: (string | number | FunctionCallConfig)[]): FunctionCallConfig
{
    return {
        function: 'uvec3',
        args: args.map(arg => (typeof arg === 'object' && arg !== null && 'name' in arg) ? (arg as { name: string }).name : arg) as (string | number | FunctionCallConfig)[],
        typeParam: 'u32',
    };
}

