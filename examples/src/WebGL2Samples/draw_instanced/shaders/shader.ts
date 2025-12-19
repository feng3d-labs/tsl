import { attribute, builtin, float, fragment, precision, return_, uint, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const pos = vec2(attribute('pos', 0));
const color = vec4(attribute('color', 1));

const v = varyingStruct({
    v_color: vec4(varying('v_color')),
    gl_Position: vec4(builtin('gl_Position')),
});

// 内置变量
const gl_InstanceID = uint(builtin('gl_InstanceID'));

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算
    v.v_color.assign(color);
    v.gl_Position.assign(vec4(pos.add(vec2(float(gl_InstanceID).subtract(0.5), 0.0)), 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算
    return_(v.v_color);
});

