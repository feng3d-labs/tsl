struct VertexInput {
    position: vec4<f32>,
}

struct VertexOutput {
    position: vec4<f32>,
    v_color: vec4<f32>,
}

@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;
@group(0) @binding(1) var<storage, read> inputData: array<VertexInput>;
@group(0) @binding(2) var<storage, read_write> outputData: array<VertexOutput>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    let input = inputData[idx];
    var output: VertexOutput;

    output.position = MVP * input.position;
    output.v_color = vec4<f32>(clamp(input.position.xy, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0, 1.0);

    outputData[idx] = output;
}