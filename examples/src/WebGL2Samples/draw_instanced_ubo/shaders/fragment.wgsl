// Material UBO - 与 bindingResources 的 key 对应
struct MaterialData {
    Diffuse: array<vec4<f32>, 2>
}
@group(0) @binding(1) var<uniform> Material: MaterialData;

struct FragmentInput {
    @location(0) @interpolate(flat) instance: i32
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return Material.Diffuse[input.instance % 2];
}
