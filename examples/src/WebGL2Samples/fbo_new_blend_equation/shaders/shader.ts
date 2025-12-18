import { assign, attribute, builtin, fragment, mat4, precision, return_, sampler, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// 输入属性
const position = vec2(attribute('position', 0));
const textureCoordinates = vec2(attribute('textureCoordinates', 1));

// Uniform
const mvp = mat4(uniform('mvp'));

// Varying
const varyings = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
    v_st: vec2(varying()),
});

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    assign(varyings.v_st, textureCoordinates);
    assign(varyings.gl_Position, mvp.multiply(vec4(position, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler('diffuse');

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, varyings.v_st));
});
