/**
 * glsl_centroid TSL 着色器
 *
 * 演示 centroid 插值限定符的使用
 *
 * TSL 用法：
 * - 普通 varying: `float(varying('v_attr'))`
 * - centroid 插值: `float(varying('v_attr', { sampling: 'centroid' }))`
 */

import {
    attribute, fragColor, fragment, gl_Position, mat4, mix, precision,
    sampler2D, select, sqrt, texture, uniform, varying, vec2, vec4, vertex
} from '@feng3d/tsl';
import { float } from '@feng3d/tsl';

// ==================== 渲染着色器（普通插值）====================

const position = vec2(attribute('position', 0));
const data = float(attribute('data', 6));
const MVP = mat4(uniform('MVP'));

// 普通 varying（默认使用 center 采样）
const v_attribute = float(varying('v_attribute'));

export const renderVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
    v_attribute.assign(data);
});

const color = vec4(fragColor(0, 'color'));

export const renderFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 定义常量颜色
    const blue = vec4(0.0, 0.0, 1.0, 1.0);
    const yellow = vec4(1.0, 1.0, 0.0, 1.0);

    // 使用 select 进行三元条件选择（对应 GLSL 的 cond ? a : b）
    // v_attribute >= 0 时使用 mix(blue, yellow, sqrt(v_attribute))，否则使用 yellow
    // 注意：当普通插值导致 v_attribute 外推为负值时，会显示黄色（表示错误）
    color.assign(select(v_attribute.greaterThanOrEqual(0.0), mix(blue, yellow, sqrt(v_attribute)), yellow));
});

// ==================== 渲染着色器（centroid 插值）====================

// centroid varying（使用 centroid 采样，避免边缘外推）
const v_attribute_centroid = float(varying('v_attribute', { sampling: 'centroid' }));

export const renderCentroidVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    gl_Position.assign(MVP.multiply(vec4(position, 0.0, 1.0)));
    v_attribute_centroid.assign(data);
});

export const renderCentroidFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const blue = vec4(0.0, 0.0, 1.0, 1.0);
    const yellow = vec4(1.0, 1.0, 0.0, 1.0);

    // 使用 select 进行三元条件选择（对应 GLSL 的 cond ? a : b）
    color.assign(select(v_attribute_centroid.greaterThanOrEqual(0.0), mix(blue, yellow, sqrt(v_attribute_centroid)), yellow));
});

// ==================== Splash 着色器（显示纹理）====================

const splashPosition = vec2(attribute('position', 0));
const texcoord = vec2(attribute('texcoord', 1));
const splashMVP = mat4(uniform('MVP'));
const v_st = vec2(varying('v_st'));

export const splashVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    v_st.assign(texcoord);
    gl_Position.assign(splashMVP.multiply(vec4(splashPosition, 0.0, 1.0)));
});

const diffuse = sampler2D(uniform('diffuse'));
const splashColor = vec4(fragColor(0, 'color'));

export const splashFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    splashColor.assign(texture(diffuse, v_st));
});
