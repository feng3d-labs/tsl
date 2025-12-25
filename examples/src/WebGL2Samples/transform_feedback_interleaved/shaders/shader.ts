import { attribute, clamp, fragment, gl_Position, mat4, precision, return_, transform, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

// =====================================================
// Transform 着色器（用于 Transform Feedback 捕获）
// =====================================================

// 输入属性
const position = attribute('position', vec4(), 0);

// Uniform
const MVP = mat4(uniform('MVP'));

// Varying 变量
const v_color = vec4(varying('v_color'));

// Transform 顶点着色器
export const transformVertexShader = transform('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 计算位置
    gl_Position.assign(MVP.multiply(position));

    // 根据位置计算颜色
    // 原始 GLSL: v_color = vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0);
    v_color.assign(vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0));
});

// Transform 片段着色器（禁用光栅化时不会被调用）
export const transformFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(vec4(1.0, 1.0, 1.0, 1.0));
});

// =====================================================
// Feedback 着色器（用于渲染捕获的结果）
// =====================================================

// Feedback 输入属性
const feedbackPosition = attribute('position', vec4(), 0);
const feedbackColor = attribute('color', vec4(), 3);

// Feedback Varying
const v_color_feedback = vec4(varying('v_color'));

// Feedback 顶点着色器
export const feedbackVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 直接使用位置（已经经过 Transform Feedback 变换）
    gl_Position.assign(feedbackPosition);

    // 传递颜色
    v_color_feedback.assign(feedbackColor);
});

// Feedback 片段着色器
export const feedbackFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出颜色
    return_(v_color_feedback);
});

