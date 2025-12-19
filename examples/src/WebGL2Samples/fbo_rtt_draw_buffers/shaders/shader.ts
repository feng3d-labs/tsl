import { attribute, builtin, color, fragment, fragmentOutput, mix, precision, return_, sampler2D, texture, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// ==================== Draw Buffer 着色器 ====================
// Pass 1: 渲染三角形到两个颜色附件

const drawBufferPosition = vec4(attribute('position'));

const vDrawBuffer = varyingStruct({
    vPosition: vec4(builtin('position')),
});

export const drawBufferVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    vDrawBuffer.vPosition.assign(drawBufferPosition);
});

// 多输出片段着色器
const drawBufferOutput = fragmentOutput({
    color1: vec4(color(0)),
    color2: vec4(color(1)),
});

export const drawBufferFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出红色到第一个颜色附件
    drawBufferOutput.color1.assign(vec4(1.0, 0.0, 0.0, 1.0));
    // 输出蓝色到第二个颜色附件
    drawBufferOutput.color2.assign(vec4(0.0, 0.0, 1.0, 1.0));

    return_(drawBufferOutput);
});

// ==================== Draw 着色器 ====================
// Pass 2: 混合两个纹理并渲染到屏幕

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

const color1Map = sampler2D('color1Map');
const color2Map = sampler2D('color2Map');

export const drawFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    const color1 = texture(color1Map, vDraw.v_st);
    const color2 = texture(color2Map, vDraw.v_st);
    // 根据 x 坐标混合两个颜色
    return_(mix(color1, color2, vDraw.v_st.x));
});
