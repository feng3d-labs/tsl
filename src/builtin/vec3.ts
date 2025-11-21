import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { FunctionCallConfig } from './vec4';

/**
 * vec3 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将 FunctionCallConfig 保存到 uniform.value 或 attribute.value
 */
export function vec3(uniform: Uniform): FunctionCallConfig;
export function vec3(attribute: Attribute): FunctionCallConfig;
export function vec3(...args: (string | number | FunctionCallConfig)[]): FunctionCallConfig;
export function vec3(...args: (string | number | FunctionCallConfig | Attribute | Uniform)[]): FunctionCallConfig
{
    // 如果只有一个参数且是 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
    if (args.length === 1 && args[0] instanceof Uniform)
    {
        const uniformArg = args[0] as Uniform;
        const valueConfig: FunctionCallConfig = {
            function: 'vec3',
            args: [uniformArg.name],
        };

        // 直接更新 uniform 的 value
        uniformArg.value = valueConfig;

        return valueConfig;
    }

    // 如果只有一个参数且是 Attribute 实例，则将 FunctionCallConfig 保存到 attribute.value
    if (args.length === 1 && args[0] instanceof Attribute)
    {
        const attributeArg = args[0] as Attribute;
        const valueConfig: FunctionCallConfig = {
            function: 'vec3',
            args: [attributeArg.name],
        };

        // 直接更新 attribute 的 value
        attributeArg.value = valueConfig;

        return valueConfig;
    }

    return {
        function: 'vec3',
        args: args.map(arg => typeof arg === 'object' && ('name' in arg) ? arg.name : arg),
    };
}

