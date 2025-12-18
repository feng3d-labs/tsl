import { attribute, builtin, flat, float, fragment, in_, int, out_, precision, varying, vertex, vec2, vec4 } from '@feng3d/tsl';

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输入属性
    const pos = vec2(attribute('pos', 0));
    const color = vec4(attribute('color', 1));
    // 输出变量
    const v_color = vec4(flat(varying('v_color')));
    const gl_Position = vec4(out_('gl_Position'));
    // 内置变量
    const gl_InstanceID = int(builtin('gl_InstanceID'));

    // 计算
    v_color.assign(color);
    gl_Position.assign(vec4(pos.add(vec2(float(gl_InstanceID).subtract(0.5), 0.0)), 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输入变量
    const v_color = vec4(flat(in_('v_color')));
    // 输出变量
    const color = vec4(out_('color'));

    // 计算
    color.assign(v_color);
});

