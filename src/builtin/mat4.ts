import { Uniform } from '../Uniform';
import { FunctionCallConfig } from './vec4';
import { Expression } from './Expression';

/**
 * mat4 构造函数
 * 如果传入单个 Uniform 实例，则将 FunctionCallConfig 保存到 uniform.value
 */
export function mat4(uniform: Uniform): Expression
{
    const valueConfig: FunctionCallConfig = {
        function: 'mat4',
        args: [uniform.name],
    };

    // 直接更新 uniform 的 value
    uniform.value = valueConfig;

    // 返回 Expression 以支持链式调用
    return new Expression(valueConfig);
}

