import { FunctionCallConfig } from './vec4';

/**
 * ivec3 构造函数
 */
export function ivec3(...args: (string | number | FunctionCallConfig)[]): FunctionCallConfig
{
    return {
        function: 'ivec3',
        args: args.map(arg => (typeof arg === 'object' && arg !== null && 'name' in arg) ? (arg as { name: string }).name : arg) as (string | number | FunctionCallConfig)[],
        typeParam: 'i32',
    };
}


