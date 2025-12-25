struct VertexInput {
    @location(0) a_position: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    // 注意：WebGPU 不支持 point_size builtin，点大小默认为 1.0
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.a_position, 0.0, 1.0);
    return output;
}

