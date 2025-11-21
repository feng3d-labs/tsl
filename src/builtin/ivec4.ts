import { FunctionCallConfig } from './vec4';

/**
 * ivec4 构造函数
 */
export function ivec4(...args: (string | number | FunctionCallConfig)[]): FunctionCallConfig
{
    return {
        function: 'ivec4',
        args: args.map(arg => (typeof arg === 'object' && arg !== null && 'name' in arg) ? (arg as { name: string }).name : arg) as (string | number | FunctionCallConfig)[],
        typeParam: 'i32',
    };
}

