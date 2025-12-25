struct VertexInput {
    @location(0) a_position: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @builtin(point_size) point_size: f32,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.a_position, 0.0, 1.0);
    output.point_size = 2.0;
    return output;
}

