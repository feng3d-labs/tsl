import { attribute, builtin, depthSampler, fragment, precision, return_, texture, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// ==================== Depth 着色器 ====================
// Pass 1: 渲染三角形到深度纹理（仅写入深度，无颜色输出）

const depthPosition = vec4(attribute('position'));

const vDepth = varyingStruct({
    vPosition: vec4(builtin('position')),
});

export const depthVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    vDepth.vPosition.assign(depthPosition);
});

export const depthFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 不输出任何颜色，仅写入深度
});

// ==================== Draw 着色器 ====================
// Pass 2: 采样深度纹理并可视化显示到屏幕

const drawPosition = vec2(attribute('position'));
const drawTexcoord = vec2(attribute('textureCoordinates'));

const vDraw = varyingStruct({
    vPosition: vec4(builtin('position')),
    v_st: vec2(varying()),
});

export const drawVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    vDraw.v_st.assign(drawTexcoord);
    vDraw.vPosition.assign(vec4(drawPosition, 0.0, 1.0));
});

// 使用 depthSampler 声明深度纹理
// 深度纹理在 WGSL 中使用 texture_depth_2d 类型和 textureLoad 函数
const depthMap = depthSampler('depthMap');

export const drawFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 从深度纹理采样深度值
    const depth = vec3(texture(depthMap, vDraw.v_st).r);
    // 反转深度值：越近越白（1-depth），越远越黑
    return_(vec4(vec3(1.0).subtract(depth), 1.0));
});
