@group(0) @binding(0) var<uniform> u_color: vec4<f32>;

@fragment
fn main() -> @location(0) vec4<f32> {
    return u_color;
}

