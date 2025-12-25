// Feedback 片段着色器（WebGPU 不支持 Transform Feedback，此文件仅作为参考）

struct FragmentInput {
    @location(0) v_color: vec4<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return input.v_color;
}

