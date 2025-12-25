// Transform 顶点着色器（WebGPU 不支持 Transform Feedback，此文件仅作为参考）

struct VertexInput {
    @location(0) position: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_color: vec4<f32>,
}

@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = MVP * input.position;
    output.v_color = vec4<f32>(clamp(input.position.xy, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0, 1.0);
    return output;
}

