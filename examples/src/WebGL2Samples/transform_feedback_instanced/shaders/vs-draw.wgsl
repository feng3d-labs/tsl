// Draw Vertex Shader (WebGPU)
// 与 vs-draw.glsl 一一对应

struct VertexInput {
    // layout(location = OFFSET_LOCATION) in vec2 a_offset;
    @location(0) a_offset: vec2<f32>,
    // layout(location = ROTATION_LOCATION) in float a_rotation;
    @location(1) a_rotation: f32,
    // layout(location = POSITION_LOCATION) in vec2 a_position;
    @location(2) a_position: vec2<f32>,
    // layout(location = COLOR_LOCATION) in vec3 a_color;
    @location(3) a_color: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    // out vec3 v_color;
    @location(0) v_color: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    // v_color = a_color;
    output.v_color = input.a_color;

    // float cos_r = cos(a_rotation);
    // float sin_r = sin(a_rotation);
    let cos_r = cos(input.a_rotation);
    let sin_r = sin(input.a_rotation);

    // mat2 rot = mat2(
    //     cos_r, sin_r,
    //     -sin_r, cos_r
    // );
    let rot = mat2x2<f32>(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    // gl_Position = vec4(rot * a_position + a_offset, 0.0, 1.0);
    output.position = vec4<f32>(rot * input.a_position + input.a_offset, 0.0, 1.0);

    return output;
}

