import {
    attribute,
    dot,
    float,
    Float,
    fragment,
    fract,
    func,
    gl_PointSize,
    gl_Position,
    if_,
    let_,
    precision,
    return_,
    sin,
    transform,
    uniform,
    varying,
    vec2,
    Vec2,
    vec4,
    vertex,
} from '@feng3d/tsl';

// =====================================================
// Transform Feedback 着色器（发射/更新粒子）
// =====================================================

// 输入属性（使用指定的 location）
const a_position = vec2(attribute('a_position', 0));
const a_velocity = vec2(attribute('a_velocity', 1));
const a_spawntime = float(attribute('a_spawntime', 2));
const a_lifetime = float(attribute('a_lifetime', 3));
const a_ID = float(attribute('a_ID', 4));

// Uniforms
const u_time = float(uniform('u_time'));
const u_acceleration = vec2(uniform('u_acceleration'));

// Varying（Transform Feedback 输出）
const v_position = vec2(varying('v_position'));
const v_velocity = vec2(varying('v_velocity'));
const v_spawntime = float(varying('v_spawntime'));
const v_lifetime = float(varying('v_lifetime'));

// 自定义随机数函数
// GLSL: float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
const rand = func('rand', [['co', vec2]], float, (co: Vec2) =>
{
    return_(fract(sin(dot(co, vec2(12.9898, 78.233))).multiply(43758.5453)));
});

// Transform Feedback 顶点着色器
export const emitVertexShader = transform('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler3D');

    // 条件：a_spawntime == 0.0 || (u_time - a_spawntime > a_lifetime) || a_position.y < -0.5
    const cond1 = a_spawntime.equals(0.0);
    const cond2 = u_time.subtract(a_spawntime).greaterThan(a_lifetime);
    const cond3 = a_position.y.lessThan(-0.5);

    // 创建复合条件（使用 Bool 的 or 方法）
    const shouldRespawn = cond1.or(cond2).or(cond3);

    if_(shouldRespawn, () =>
    {
        // 生成新粒子
        // v_position = vec2(0.0, 0.0);
        v_position.assign(vec2(0.0, 0.0));
        // v_velocity = vec2(rand(vec2(a_ID, 0.0)) - 0.5, rand(vec2(a_ID, a_ID)));
        v_velocity.assign(vec2(
            rand(vec2(a_ID, 0.0)).subtract(0.5),
            rand(vec2(a_ID, a_ID)),
        ));
        // v_spawntime = u_time;
        v_spawntime.assign(u_time);
        // v_lifetime = 5000.0;
        v_lifetime.assign(float(5000.0));
    }).else(() =>
    {
        // 更新现有粒子
        // v_velocity = a_velocity + 0.01 * u_acceleration;
        const newVelocity = let_('newVelocity', a_velocity.add(float(0.01).multiply(u_acceleration)));
        v_velocity.assign(newVelocity);
        // v_position = a_position + 0.01 * v_velocity;
        v_position.assign(a_position.add(float(0.01).multiply(newVelocity)));
        // v_spawntime = a_spawntime;
        v_spawntime.assign(a_spawntime);
        // v_lifetime = a_lifetime;
        v_lifetime.assign(a_lifetime);
    });

    // gl_Position = vec4(v_position, 0.0, 1.0);
    gl_Position.assign(vec4(v_position, 0.0, 1.0));
});

// =====================================================
// 渲染着色器（绘制粒子）
// =====================================================

// 渲染输入属性
const draw_position = vec2(attribute('a_position', 0));

// 渲染顶点着色器
export const drawVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('highp', 'sampler3D');

    gl_Position.assign(vec4(draw_position, 0.0, 1.0));
    gl_PointSize.assign(float(2.0));
});

// 渲染 Uniform
const u_color = vec4(uniform('u_color'));

// 渲染片段着色器
export const drawFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(u_color);
});

