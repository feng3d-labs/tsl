import { attribute, fragColor, fragment, gl_Position, mat4, precision, sampler2D, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// ==================== 顶点着色器 ====================

const position = vec2(attribute('position', 0));
const textureCoordinates = vec2(attribute('textureCoordinates', 4));
const mvp = mat4(uniform('mvp'));

// Varying 变量
const v_st = vec2(varying('v_st'));

export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

// ==================== 片段着色器 ====================

const diffuse = sampler2D(uniform('diffuse'));
const color = vec4(fragColor(0, 'color'));

export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    color.assign(texture(diffuse, v_st));
});
