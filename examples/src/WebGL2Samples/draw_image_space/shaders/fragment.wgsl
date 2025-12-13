@binding(0) @group(0) var diffuse_texture: texture_2d<f32>;
@binding(1) @group(0) var diffuse: sampler;
@binding(2) @group(0) var<uniform> u_imageSize: vec2f;

@fragment
fn main(
    @builtin(position) fragCoord: vec4f,
) -> @location(0) vec4f {
    // 计算纹理坐标，处理图像翻转问题
    // fragCoord.xy 是窗口坐标，范围从 (0, 0) 到 (canvasWidth, canvasHeight)
    let texCoord = vec2f(
        fragCoord.x / u_imageSize.x,
        (u_imageSize.y - fragCoord.y) / u_imageSize.y
    );
    
    // 采样纹理并返回颜色
    return textureSample(diffuse_texture, diffuse, texCoord);
}