// Transform Feedback Emit Compute Shader (WebGPU)
// 与 vs-emit.glsl 一一对应

const M_2PI: f32 = 6.28318530718;

const MAP_HALF_LENGTH: f32 = 1.01;
const WANDER_CIRCLE_R: f32 = 0.01;
const WANDER_CIRCLE_OFFSET: f32 = 0.04;
const MOVE_DELTA: f32 = 0.001;

// uniform float u_time;
@group(0) @binding(0) var<uniform> u_time: f32;

// layout(location = OFFSET_LOCATION) in vec2 a_offset;
// layout(location = ROTATION_LOCATION) in float a_rotation;
@group(0) @binding(1) var<storage, read> inputData_a_offset: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> inputData_a_rotation: array<f32>;

// out vec2 v_offset;
// out float v_rotation;
@group(0) @binding(3) var<storage, read_write> outputData_v_offset: array<vec2<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData_v_rotation: array<f32>;

// float rand(vec2 co)
// {
//     return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
// }
fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;

    let a_offset = inputData_a_offset[idx];
    let a_rotation = inputData_a_rotation[idx];

    // float theta = M_2PI * rand(vec2(u_time, a_rotation + a_offset.x + a_offset.y));
    let theta = M_2PI * rand(vec2<f32>(u_time, a_rotation + a_offset.x + a_offset.y));

    // float cos_r = cos(a_rotation);
    // float sin_r = sin(a_rotation);
    let cos_r = cos(a_rotation);
    let sin_r = sin(a_rotation);

    // mat2 rot = mat2(
    //     cos_r, sin_r,
    //     -sin_r, cos_r
    // );
    let rot = mat2x2<f32>(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    // vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    let p = WANDER_CIRCLE_R * vec2<f32>(cos(theta), sin(theta)) + vec2<f32>(WANDER_CIRCLE_OFFSET, 0.0);

    // vec2 move = normalize(rot * p);
    let moveDir = normalize(rot * p);

    // v_rotation = atan(move.y, move.x);
    let v_rotation = atan2(moveDir.y, moveDir.x);

    // v_offset = a_offset + MOVE_DELTA * move;
    var v_offset = a_offset + MOVE_DELTA * moveDir;

    // wrapping at edges
    // v_offset = vec2 ( 
    //     v_offset.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.x ) , 
    //     v_offset.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.y )
    // );
    // select(falseVal, trueVal, condition) 对应 condition ? trueVal : falseVal
    v_offset = vec2<f32>(
        select(select(v_offset.x, MAP_HALF_LENGTH, v_offset.x < -MAP_HALF_LENGTH), -MAP_HALF_LENGTH, v_offset.x > MAP_HALF_LENGTH),
        select(select(v_offset.y, MAP_HALF_LENGTH, v_offset.y < -MAP_HALF_LENGTH), -MAP_HALF_LENGTH, v_offset.y > MAP_HALF_LENGTH)
    );

    // gl_Position = vec4(v_offset, 0.0, 1.0); // 在 compute shader 中忽略

    outputData_v_offset[idx] = v_offset;
    outputData_v_rotation[idx] = v_rotation;
}

