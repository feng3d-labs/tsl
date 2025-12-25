// Draw Fragment Shader (WebGPU)
// 与 fs-draw.glsl 一一对应

// #define ALPHA 0.9
const ALPHA: f32 = 0.9;

struct FragmentInput {
    // in vec3 v_color;
    @location(0) v_color: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    // color = vec4(v_color * ALPHA, ALPHA);
    return vec4<f32>(input.v_color * ALPHA, ALPHA);
}

