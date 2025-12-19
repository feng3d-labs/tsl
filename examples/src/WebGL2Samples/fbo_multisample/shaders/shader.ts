import { attribute, builtin, fragment, mat4, precision, return_, sampler2D, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

// ============ Render Shader（渲染到多重采样纹理）============

// 输入属性
const renderPosition = vec2(attribute('position', 0));

// Uniform
const renderMVP = mat4(uniform('MVP'));

// Varying
const vRender = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
});

// 顶点着色器
export const renderVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    vRender.gl_Position.assign(renderMVP.multiply(vec4(renderPosition, 0.0, 1.0)));
});

// 片段着色器
export const renderFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 输出固定颜色：橙色
    return_(vec4(1.0, 0.5, 0.0, 1.0));
});

// ============ Splash Shader（将纹理渲染到屏幕）============

// 输入属性
const splashPosition = vec2(attribute('position', 0));
const splashTexcoord = vec2(attribute('texcoord', 1));

// Uniform
const splashMVP = mat4(uniform('MVP'));

// Varying
const vSplash = varyingStruct({
    gl_Position: vec4(builtin('gl_Position')),
    uv: vec2(varying()),
});

// 顶点着色器
export const splashVertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    vSplash.uv.assign(splashTexcoord);
    vSplash.gl_Position.assign(splashMVP.multiply(vec4(splashPosition, 0.0, 1.0)));
});

// 纹理采样器
const diffuse = sampler2D('diffuse');

// 片段着色器
export const splashFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, vSplash.uv));
});
