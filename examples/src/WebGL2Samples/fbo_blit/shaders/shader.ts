import { assign, attribute, builtin, fragment, mat4, precision, return_, sampler, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const position = vec2(attribute('position', 0));
const texcoord = vec2(attribute('texcoord', 4));

// Uniform
const MVP = mat4(uniform('MVP'));

// Varying
const v = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
    v_st: vec2(varying()),
});

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    assign(v.v_st, texcoord);
    assign(v.gl_Position, MVP.multiply(vec4(position, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler('diffuse');

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, v.v_st));
});
