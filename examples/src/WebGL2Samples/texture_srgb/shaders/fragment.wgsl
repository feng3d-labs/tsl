@group(0) @binding(1) var materialDiffuse_texture: texture_2d<f32>;
@group(0) @binding(2) var materialDiffuse: sampler;

struct VaryingStruct {
    @location(0) v_st: vec2<f32>,
    @location(1) v_blurTexCoords_0: vec2<f32>,
    @location(2) v_blurTexCoords_1: vec2<f32>,
    @location(3) v_blurTexCoords_2: vec2<f32>,
    @location(4) v_blurTexCoords_3: vec2<f32>,
    @location(5) v_blurTexCoords_4: vec2<f32>,
    @location(6) v_blurTexCoords_5: vec2<f32>,
    @location(7) v_blurTexCoords_6: vec2<f32>,
    @location(8) v_blurTexCoords_7: vec2<f32>,
    @location(9) v_blurTexCoords_8: vec2<f32>,
    @location(10) v_blurTexCoords_9: vec2<f32>,
    @location(11) v_blurTexCoords_10: vec2<f32>,
    @location(12) v_blurTexCoords_11: vec2<f32>,
    @location(13) v_blurTexCoords_12: vec2<f32>,
    @location(14) v_blurTexCoords_13: vec2<f32>,
    @location(15) h_blurTexCoords_0: vec2<f32>,
    @location(16) h_blurTexCoords_1: vec2<f32>,
    @location(17) h_blurTexCoords_2: vec2<f32>,
    @location(18) h_blurTexCoords_3: vec2<f32>,
    @location(19) h_blurTexCoords_4: vec2<f32>,
    @location(20) h_blurTexCoords_5: vec2<f32>,
    @location(21) h_blurTexCoords_6: vec2<f32>,
    @location(22) h_blurTexCoords_7: vec2<f32>,
    @location(23) h_blurTexCoords_8: vec2<f32>,
    @location(24) h_blurTexCoords_9: vec2<f32>,
    @location(25) h_blurTexCoords_10: vec2<f32>,
    @location(26) h_blurTexCoords_11: vec2<f32>,
    @location(27) h_blurTexCoords_12: vec2<f32>,
    @location(28) h_blurTexCoords_13: vec2<f32>,
}

fn rgbToSrgb(colorRGB: vec3<f32>, gammaCorrection: f32) -> vec3<f32> {
    let clampedColorRGB = clamp(colorRGB, vec3<f32>(0.0), vec3<f32>(1.0));
    let threshold = vec3<f32>(0.0031308);
    let lowValue = clampedColorRGB * 12.92;
    let highValue = pow(clampedColorRGB, vec3<f32>(gammaCorrection)) * 1.055 - vec3<f32>(0.055);
    return select(highValue, lowValue, clampedColorRGB < threshold);
}

fn contrastSaturationBrightness(color: vec3<f32>, brt: f32, sat: f32, con: f32) -> vec3<f32> {
    let lumCoeff = vec3<f32>(0.2125, 0.7154, 0.0721);
    let brtColor = color * brt;
    let intensity = vec3<f32>(dot(brtColor, lumCoeff));
    let satColor = mix(intensity, brtColor, sat);
    let conColor = mix(vec3<f32>(0.5), satColor, con);
    return conColor;
}

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    let sampleCoord = fract(v.v_st);

    // sRGB 纹理采样（GPU 自动将 sRGB 转换为线性 RGB）
    var colorRgb = vec4<f32>(textureSample(materialDiffuse_texture, materialDiffuse, v.v_st).rgb, 1.0);

    // 垂直方向高斯模糊
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_0), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_1), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_2), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_3), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_4), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_5), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_6), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_7), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_8), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_9), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_10), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_11), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_12), sampleCoord.y);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.v_blurTexCoords_13), sampleCoord.y);

    // 水平方向高斯模糊
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_0), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_1), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_2), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_3), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_4), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_5), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_6), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_7), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_8), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_9), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_10), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_11), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_12), sampleCoord.x);
    colorRgb = mix(colorRgb, textureSample(materialDiffuse_texture, materialDiffuse, v.h_blurTexCoords_13), sampleCoord.x);

    let brightness = 1.0;
    let saturation = 0.5;
    let contrast = 1.0;
    let adjustedColor = contrastSaturationBrightness(colorRgb.rgb, brightness, saturation, contrast);
    return vec4<f32>(rgbToSrgb(adjustedColor, 0.41666), 1.0);
}
