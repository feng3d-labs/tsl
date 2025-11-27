// 根据 fragment-multiple-output.glsl 生成，保持风格一致

@fragment
fn main() -> @location(0) vec4<f32>, @location(1) vec4<f32>, @location(2) vec4<f32> {
    return vec4<f32>(0.5, 0.0, 0.0, 1.0), vec4<f32>(0.0, 0.3, 0.0, 1.0), vec4<f32>(0.0, 0.0, 0.8, 1.0);
}
