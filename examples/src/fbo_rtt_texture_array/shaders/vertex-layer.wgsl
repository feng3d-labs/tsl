// 根据 vertex-layer.glsl 生成，保持风格一致
// #define POSITION_LOCATION 0
// #define TEXCOORD_LOCATION 4

struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) v_st: vec2<f32>,
}

@binding(0) @group(0) var<uniform> mvp : mat4x4<f32>;

@vertex
fn main(
    @location(0) position: vec2<f32>,
    @location(4) textureCoordinates: vec2<f32>,
) -> VaryingStruct {
    var v: VaryingStruct;
    v.v_st = textureCoordinates;
    v.vPosition = mvp * vec4<f32>(position, 0.0, 1.0);
    return v;
}
