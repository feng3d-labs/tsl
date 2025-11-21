import { Attribute } from '../Attribute';
import { Uniform } from '../Uniform';
import { FunctionCallConfig, Expression } from './vec4';

/**
 * vec3 构造函数
 * 如果传入单个 Uniform 或 Attribute 实例，则将 FunctionCallConfig 保存到 uniform.value 或 attribute.value
 */
export function vec3(uniform: Uniform): Expression;
export function vec3(attribute: Attribute): Expression;
export function vec3(...args: (string | number | FunctionCallConfig | Expression)[]): Expression;
export function vec3(...args: (string | number | FunctionCallConfig | Expression | Attribute | Uniform)[]): Expression
{
    // 延迟导入 Vec3 以避免循环依赖
    // @ts-ignore - 动态导入以避免循环依赖
    const { Vec3 } = eval('require')('./Vec3');

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

        return new Vec3(valueConfig);
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

        return new Vec3(valueConfig);
    }

    const config: FunctionCallConfig = {
        function: 'vec3',
        args: args.map(arg => {
            if (arg instanceof Expression)
            {
                return arg.config;
            }
            return typeof arg === 'object' && ('name' in arg) ? arg.name : arg;
        }),
    };

    return new Vec3(config);
}
