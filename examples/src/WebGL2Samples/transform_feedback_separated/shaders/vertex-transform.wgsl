struct VertexInput {
    position: vec4<f32>,
}

@group(0) @binding(0) var<uniform> MVP: mat4x4<f32>;
@group(0) @binding(1) var<storage, read> inputData: array<VertexInput>;
@group(0) @binding(2) var<storage, read_write> outputData_gl_Position: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outputData_v_color: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    let input = inputData[idx];

    outputData_gl_Position[idx] = MVP * input.position;
    outputData_v_color[idx] = vec4<f32>(clamp(input.position.xy, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0, 1.0);
}