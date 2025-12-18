import { Builtin, builtin, flat, float, fragment, in_, int, out_, precision, return_, vertex, vec2, vec4 } from '@feng3d/tsl';

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const pos = vec2(in_('pos', 0));
    const color = vec4(in_('color', 1));
    const v_color = vec4(flat(out_('v_color')));
    const gl_Position = vec4(out_('gl_Position'));
    const gl_InstanceID = int(builtin('gl_InstanceID'));

    v_color.assign(color);
    gl_Position.assign(vec4(pos.add(vec2(float(gl_InstanceID).subtract(0.5), 0.0)), 0.0, 1.0));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const v_color = vec4(flat(in_('v_color')));
    const color = vec4(out_('color'));

    color.assign(v_color);
});
