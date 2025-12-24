import { array, attribute, clamp, dot, fract, fragment, gl_Position, lessThan, let_, mat4, mix, pow, precision, return_, sampler2D, texture, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// 顶点属性
const position = vec2(attribute('position', 0));
const textureCoordinates = vec2(attribute('textureCoordinates', 4));

// Uniform 变量
const mvp = mat4(uniform('mvp'));

// Varying 变量
const v_st = vec2(varying('v_st', { location: 0 }));
const v_blurTexCoords = array(vec2(varying('v_blurTexCoords', { location: 1 })), 14);
const h_blurTexCoords = array(vec2(varying('h_blurTexCoords', { location: 15 })), 14);

/**
 * 顶点着色器
 * 传递纹理坐标并应用 MVP 变换，计算模糊采样坐标
 */
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));

    // 垂直方向模糊坐标
    v_blurTexCoords.index(0).assign(v_st.add(vec2(0.0, -0.050)));
    v_blurTexCoords.index(1).assign(v_st.add(vec2(0.0, -0.036)));
    v_blurTexCoords.index(2).assign(v_st.add(vec2(0.0, -0.020)));
    v_blurTexCoords.index(3).assign(v_st.add(vec2(0.0, -0.016)));
    v_blurTexCoords.index(4).assign(v_st.add(vec2(0.0, -0.012)));
    v_blurTexCoords.index(5).assign(v_st.add(vec2(0.0, -0.008)));
    v_blurTexCoords.index(6).assign(v_st.add(vec2(0.0, -0.004)));
    v_blurTexCoords.index(7).assign(v_st.add(vec2(0.0, 0.004)));
    v_blurTexCoords.index(8).assign(v_st.add(vec2(0.0, 0.008)));
    v_blurTexCoords.index(9).assign(v_st.add(vec2(0.0, 0.012)));
    v_blurTexCoords.index(10).assign(v_st.add(vec2(0.0, 0.016)));
    v_blurTexCoords.index(11).assign(v_st.add(vec2(0.0, 0.020)));
    v_blurTexCoords.index(12).assign(v_st.add(vec2(0.0, 0.036)));
    v_blurTexCoords.index(13).assign(v_st.add(vec2(0.0, 0.050)));

    // 水平方向模糊坐标
    h_blurTexCoords.index(0).assign(v_st.add(vec2(-0.050, 0.0)));
    h_blurTexCoords.index(1).assign(v_st.add(vec2(-0.036, 0.0)));
    h_blurTexCoords.index(2).assign(v_st.add(vec2(-0.020, 0.0)));
    h_blurTexCoords.index(3).assign(v_st.add(vec2(-0.016, 0.0)));
    h_blurTexCoords.index(4).assign(v_st.add(vec2(-0.012, 0.0)));
    h_blurTexCoords.index(5).assign(v_st.add(vec2(-0.008, 0.0)));
    h_blurTexCoords.index(6).assign(v_st.add(vec2(-0.004, 0.0)));
    h_blurTexCoords.index(7).assign(v_st.add(vec2(0.004, 0.0)));
    h_blurTexCoords.index(8).assign(v_st.add(vec2(0.008, 0.0)));
    h_blurTexCoords.index(9).assign(v_st.add(vec2(0.012, 0.0)));
    h_blurTexCoords.index(10).assign(v_st.add(vec2(0.016, 0.0)));
    h_blurTexCoords.index(11).assign(v_st.add(vec2(0.020, 0.0)));
    h_blurTexCoords.index(12).assign(v_st.add(vec2(0.036, 0.0)));
    h_blurTexCoords.index(13).assign(v_st.add(vec2(0.050, 0.0)));
});

// 纹理采样器
const materialDiffuse = sampler2D(uniform('materialDiffuse'));

/**
 * 片段着色器
 * 1. 从 sRGB 纹理采样（自动转换为线性 RGB）
 * 2. 应用完整的 14 点高斯模糊滤波器
 * 3. 应用亮度、饱和度、对比度调整
 * 4. 使用正确的 gamma 校正转回 sRGB（包含 lessThan 分支）
 */
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 获取采样坐标的小数部分（用于混合权重）
    const sampleCoord = let_('sampleCoord', fract(v_st));

    // 从 sRGB 纹理采样（GPU 自动将 sRGB 转换为线性 RGB）
    let colorRgb = let_('colorRgb', vec4(texture(materialDiffuse, v_st).xyz, 1.0));

    // 垂直方向模糊采样（14 点）
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(0)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(1)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(2)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(3)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(4)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(5)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(6)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(7)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(8)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(9)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(10)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(11)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(12)), sampleCoord.y));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, v_blurTexCoords.index(13)), sampleCoord.y));

    // 水平方向模糊采样（14 点）
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(0)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(1)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(2)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(3)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(4)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(5)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(6)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(7)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(8)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(9)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(10)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(11)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(12)), sampleCoord.x));
    colorRgb.assign(mix(colorRgb, texture(materialDiffuse, h_blurTexCoords.index(13)), sampleCoord.x));

    // 亮度、饱和度、对比度参数
    const brightness = 1.0;
    const saturation = 0.5;
    const contrast = 1.0;

    // 亮度系数（用于计算灰度）
    const lumCoeff = vec3(0.2125, 0.7154, 0.0721);

    // 应用亮度
    const brtColor = let_('brtColor', colorRgb.xyz.multiply(brightness));

    // 计算灰度强度
    const intensity = let_('intensity', vec3(dot(brtColor, lumCoeff)));

    // 应用饱和度
    const satColor = let_('satColor', mix(intensity, brtColor, saturation));

    // 应用对比度
    const conColor = let_('conColor', mix(vec3(0.5), satColor, contrast));

    // Gamma 校正参数（约 1/2.4）
    const gammaCorrection = 0.41666;
    const gammaVec = vec3(gammaCorrection, gammaCorrection, gammaCorrection);

    // 钳制颜色值到 [0, 1] 范围
    const clampedColorRGB = let_('clampedColorRGB', clamp(conColor, vec3(0.0), vec3(1.0)));

    // 正确的 sRGB 转换：
    // 对于小于 0.0031308 的值使用线性映射 (x * 12.92)
    // 对于大于等于的值使用 gamma 曲线 (pow(x, gamma) * 1.055 - 0.055)
    const thresholdVec = vec3(0.0031308);
    const linearPart = let_('linearPart', clampedColorRGB.multiply(12.92));
    const powResult = let_('powResult', pow(clampedColorRGB, gammaVec));
    const gammaPart = let_('gammaPart', powResult.multiply(1.055).subtract(vec3(0.055)));

    // 使用 lessThan 进行向量比较，mix 选择正确的值
    const srgbColor = let_('srgbColor', mix(gammaPart, linearPart, lessThan(clampedColorRGB, thresholdVec)));

    return_(vec4(srgbColor, 1.0));
});
