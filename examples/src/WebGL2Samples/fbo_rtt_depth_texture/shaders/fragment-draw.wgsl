@group(0) @binding(0) var depthMap_texture: texture_2d<f32>;
@group(0) @binding(1) var depthMap: sampler;

struct FragmentInput {
    @location(0) v_st: vec2<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let depth = vec3<f32>(textureSample(depthMap_texture, depthMap, input.v_st).r);
    return vec4<f32>(1.0 - depth, 1.0);
}
