/**
 * Transform Feedback Instanced TSL 着色器
 * 与 vs-emit.glsl、vs-draw.glsl、fs-draw.glsl 一一对应
 */

import {
    attribute,
    atan,
    cos,
    dot,
    float,
    Float,
    fragment,
    fract,
    func,
    gl_Position,
    let_,
    mat2,
    normalize,
    precision,
    return_,
    select,
    sin,
    transform,
    uniform,
    varying,
    vec2,
    Vec2,
    vec3,
    vec4,
    vertex,
} from '@feng3d/tsl';

// =====================================================
// vs-emit.glsl 对应的 TSL 代码
// =====================================================

// #define M_2PI 6.28318530718
// #define MAP_HALF_LENGTH 1.01
// #define WANDER_CIRCLE_R 0.01
// #define WANDER_CIRCLE_OFFSET 0.04
// #define MOVE_DELTA 0.001
const M_2PI = 6.28318530718;
const MAP_HALF_LENGTH = 1.01;
const WANDER_CIRCLE_R = 0.01;
const WANDER_CIRCLE_OFFSET = 0.04;
const MOVE_DELTA = 0.001;

// uniform float u_time;
const u_time = uniform('u_time', float());

// layout(location = OFFSET_LOCATION) in vec2 a_offset;
// layout(location = ROTATION_LOCATION) in float a_rotation;
const a_offset = attribute('a_offset', vec2(), 0);
const a_rotation = attribute('a_rotation', float(), 1);

// out vec2 v_offset;
// out float v_rotation;
const v_offset = varying('v_offset', vec2());
const v_rotation = varying('v_rotation', float());

// float rand(vec2 co)
// {
//     return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
// }
const rand = func('rand', [['co', vec2]], float, (co: Vec2) =>
{
    return_(fract(sin(dot(co, vec2(12.9898, 78.233))).multiply(43758.5453)));
});

// void main() - vs-emit
export const emitVertexShader = transform('main', () =>
{
    // precision highp float;
    // precision highp int;
    precision('highp', 'float');
    precision('highp', 'int');

    // float theta = M_2PI * rand(vec2(u_time, a_rotation + a_offset.x + a_offset.y));
    const theta = let_('theta', float(M_2PI).multiply(rand(vec2(u_time, a_rotation.add(a_offset.x).add(a_offset.y)))));

    // float cos_r = cos(a_rotation);
    // float sin_r = sin(a_rotation);
    const cos_r = let_('cos_r', cos(a_rotation));
    const sin_r = let_('sin_r', sin(a_rotation));

    // mat2 rot = mat2(cos_r, sin_r, -sin_r, cos_r);
    const rot = mat2(cos_r, sin_r, sin_r.negate(), cos_r);

    // vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    const p = let_('p', vec2(cos(theta), sin(theta)).multiply(WANDER_CIRCLE_R).add(vec2(WANDER_CIRCLE_OFFSET, 0.0)));

    // vec2 move = normalize(rot * p);
    const moveDir = let_('moveDir', normalize(rot.multiply(p)));

    // v_rotation = atan(move.y, move.x);
    v_rotation.assign(atan(moveDir.y, moveDir.x));

    // v_offset = a_offset + MOVE_DELTA * move;
    const newOffset = let_('newOffset', a_offset.add(moveDir.multiply(MOVE_DELTA)));

    // wrapping at edges
    // v_offset.x = v_offset.x > MAP_HALF_LENGTH ? -MAP_HALF_LENGTH : (v_offset.x < -MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.x);
    // v_offset.y = v_offset.y > MAP_HALF_LENGTH ? -MAP_HALF_LENGTH : (v_offset.y < -MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.y);
    const wrapCoord = (coord: Float) => select(
        coord.greaterThan(MAP_HALF_LENGTH),
        float(-MAP_HALF_LENGTH),
        select(coord.lessThan(float(-MAP_HALF_LENGTH)), float(MAP_HALF_LENGTH), coord),
    );
    v_offset.assign(vec2(wrapCoord(newOffset.x), wrapCoord(newOffset.y)));

    // gl_Position = vec4(v_offset, 0.0, 1.0);
    gl_Position.assign(vec4(v_offset, 0.0, 1.0));
});

// =====================================================
// vs-draw.glsl 对应的 TSL 代码
// =====================================================

// layout(location = POSITION_LOCATION) in vec2 a_position;
// layout(location = ROTATION_LOCATION) in float a_rotation;
// layout(location = OFFSET_LOCATION) in vec2 a_offset;
// layout(location = COLOR_LOCATION) in vec3 a_color;
const draw_position = attribute('a_position', vec2(), 2);
const draw_rotation = attribute('a_rotation', float(), 1);
const draw_offset = attribute('a_offset', vec2(), 0);
const draw_color = attribute('a_color', vec3(), 3);

// out vec3 v_color;
const v_color = varying('v_color', vec3());

// void main() - vs-draw
export const drawVertexShader = vertex('main', () =>
{
    // precision highp float;
    // precision highp int;
    precision('highp', 'float');
    precision('highp', 'int');

    // v_color = a_color;
    v_color.assign(draw_color);

    // float cos_r = cos(a_rotation);
    // float sin_r = sin(a_rotation);
    const cos_r = let_('cos_r', cos(draw_rotation));
    const sin_r = let_('sin_r', sin(draw_rotation));

    // mat2 rot = mat2(cos_r, sin_r, -sin_r, cos_r);
    const rot = mat2(cos_r, sin_r, sin_r.negate(), cos_r);

    // gl_Position = vec4(rot * a_position + a_offset, 0.0, 1.0);
    gl_Position.assign(vec4(rot.multiply(draw_position).add(draw_offset), 0.0, 1.0));
});

// =====================================================
// fs-draw.glsl 对应的 TSL 代码
// =====================================================

// #define ALPHA 0.9
const ALPHA = 0.9;

// void main() - fs-draw
export const drawFragmentShader = fragment('main', () =>
{
    // precision highp float;
    // precision highp int;
    precision('highp', 'float');
    precision('highp', 'int');

    // color = vec4(v_color * ALPHA, ALPHA);
    return_(vec4(v_color.multiply(ALPHA), ALPHA));
});
