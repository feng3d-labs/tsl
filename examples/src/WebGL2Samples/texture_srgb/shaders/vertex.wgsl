@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;

struct VaryingStruct {
    @builtin(position) position: vec4<f32>,
    @location(0) v_st: vec2<f32>,
    @location(1) v_blurTexCoords_0: vec2<f32>,
    @location(2) v_blurTexCoords_1: vec2<f32>,
    @location(3) v_blurTexCoords_2: vec2<f32>,
    @location(4) v_blurTexCoords_3: vec2<f32>,
    @location(5) v_blurTexCoords_4: vec2<f32>,
    @location(6) v_blurTexCoords_5: vec2<f32>,
    @location(7) v_blurTexCoords_6: vec2<f32>,
    @location(8) v_blurTexCoords_7: vec2<f32>,
    @location(9) v_blurTexCoords_8: vec2<f32>,
    @location(10) v_blurTexCoords_9: vec2<f32>,
    @location(11) v_blurTexCoords_10: vec2<f32>,
    @location(12) v_blurTexCoords_11: vec2<f32>,
    @location(13) v_blurTexCoords_12: vec2<f32>,
    @location(14) v_blurTexCoords_13: vec2<f32>,
    @location(15) h_blurTexCoords_0: vec2<f32>,
    @location(16) h_blurTexCoords_1: vec2<f32>,
    @location(17) h_blurTexCoords_2: vec2<f32>,
    @location(18) h_blurTexCoords_3: vec2<f32>,
    @location(19) h_blurTexCoords_4: vec2<f32>,
    @location(20) h_blurTexCoords_5: vec2<f32>,
    @location(21) h_blurTexCoords_6: vec2<f32>,
    @location(22) h_blurTexCoords_7: vec2<f32>,
    @location(23) h_blurTexCoords_8: vec2<f32>,
    @location(24) h_blurTexCoords_9: vec2<f32>,
    @location(25) h_blurTexCoords_10: vec2<f32>,
    @location(26) h_blurTexCoords_11: vec2<f32>,
    @location(27) h_blurTexCoords_12: vec2<f32>,
    @location(28) h_blurTexCoords_13: vec2<f32>,
}

@vertex
fn main(
    @location(0) position: vec2<f32>,
    @location(4) textureCoordinates: vec2<f32>
) -> VaryingStruct {
    var v: VaryingStruct;
    v.v_st = textureCoordinates;
    var pos = mvp * vec4<f32>(position, 0.0, 1.0);
    pos.z = pos.z * 0.5 + pos.w * 0.5;
    v.position = pos;

    v.v_blurTexCoords_0 = v.v_st + vec2<f32>(0.0, -0.050);
    v.v_blurTexCoords_1 = v.v_st + vec2<f32>(0.0, -0.036);
    v.v_blurTexCoords_2 = v.v_st + vec2<f32>(0.0, -0.020);
    v.v_blurTexCoords_3 = v.v_st + vec2<f32>(0.0, -0.016);
    v.v_blurTexCoords_4 = v.v_st + vec2<f32>(0.0, -0.012);
    v.v_blurTexCoords_5 = v.v_st + vec2<f32>(0.0, -0.008);
    v.v_blurTexCoords_6 = v.v_st + vec2<f32>(0.0, -0.004);
    v.v_blurTexCoords_7 = v.v_st + vec2<f32>(0.0,  0.004);
    v.v_blurTexCoords_8 = v.v_st + vec2<f32>(0.0,  0.008);
    v.v_blurTexCoords_9 = v.v_st + vec2<f32>(0.0,  0.012);
    v.v_blurTexCoords_10 = v.v_st + vec2<f32>(0.0,  0.016);
    v.v_blurTexCoords_11 = v.v_st + vec2<f32>(0.0,  0.020);
    v.v_blurTexCoords_12 = v.v_st + vec2<f32>(0.0,  0.036);
    v.v_blurTexCoords_13 = v.v_st + vec2<f32>(0.0,  0.050);

    v.h_blurTexCoords_0 = v.v_st + vec2<f32>(-0.050, 0.0);
    v.h_blurTexCoords_1 = v.v_st + vec2<f32>(-0.036, 0.0);
    v.h_blurTexCoords_2 = v.v_st + vec2<f32>(-0.020, 0.0);
    v.h_blurTexCoords_3 = v.v_st + vec2<f32>(-0.016, 0.0);
    v.h_blurTexCoords_4 = v.v_st + vec2<f32>(-0.012, 0.0);
    v.h_blurTexCoords_5 = v.v_st + vec2<f32>(-0.008, 0.0);
    v.h_blurTexCoords_6 = v.v_st + vec2<f32>(-0.004, 0.0);
    v.h_blurTexCoords_7 = v.v_st + vec2<f32>( 0.004, 0.0);
    v.h_blurTexCoords_8 = v.v_st + vec2<f32>( 0.008, 0.0);
    v.h_blurTexCoords_9 = v.v_st + vec2<f32>( 0.012, 0.0);
    v.h_blurTexCoords_10 = v.v_st + vec2<f32>( 0.016, 0.0);
    v.h_blurTexCoords_11 = v.v_st + vec2<f32>( 0.020, 0.0);
    v.h_blurTexCoords_12 = v.v_st + vec2<f32>( 0.036, 0.0);
    v.h_blurTexCoords_13 = v.v_st + vec2<f32>( 0.050, 0.0);

    return v;
}
