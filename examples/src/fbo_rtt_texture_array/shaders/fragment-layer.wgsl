// 根据 fragment-layer.glsl 生成，保持风格一致

struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_st: vec2<f32>,
}

@binding(1) @group(0) var diffuse_texture: texture_2d_array<f32>;
@binding(2) @group(0) var diffuse: sampler;
@binding(0) @group(0) var<uniform> layer : i32;

@fragment
fn main(v: VaryingStruct) -> @location(0) vec4<f32> {
    return textureSample(diffuse_texture, diffuse, vec3<f32>(v.v_st, f32(layer)));
}
