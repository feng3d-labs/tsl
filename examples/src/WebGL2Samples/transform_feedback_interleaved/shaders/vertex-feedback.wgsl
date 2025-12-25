// Feedback 顶点着色器（WebGPU 不支持 Transform Feedback，此文件仅作为参考）

struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(3) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_color: vec4<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = input.position;
    output.v_color = input.color;
    return output;
}

