import { attribute, builtin, fragment, precision, return_, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const pos = vec2(attribute('pos', 0));

const v = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
});

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算位置
    v.gl_Position.assign(vec4(pos, 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出固定颜色：橙色 (1.0, 0.5, 0.0, 1.0)
    return_(vec4(1.0, 0.5, 0.0, 1.0));
});

