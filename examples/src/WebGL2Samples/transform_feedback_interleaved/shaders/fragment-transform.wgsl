// Transform 片段着色器（WebGPU 不支持 Transform Feedback，此文件仅作为参考）

@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}

