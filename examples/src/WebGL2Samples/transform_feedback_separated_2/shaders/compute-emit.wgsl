struct VertexInput {
    a_position: vec2<f32>,
    a_velocity: vec2<f32>,
    a_spawntime: f32,
    a_lifetime: f32,
    a_ID: f32,
}

@group(0) @binding(0) var<uniform> u_time: f32;
@group(0) @binding(1) var<uniform> u_acceleration: vec2<f32>;
@group(0) @binding(2) var<storage, read> inputData: array<VertexInput>;
@group(0) @binding(3) var<storage, read_write> outputData_v_position: array<vec2<f32>>;
@group(0) @binding(4) var<storage, read_write> outputData_v_velocity: array<vec2<f32>>;
@group(0) @binding(5) var<storage, read_write> outputData_v_spawntime: array<f32>;
@group(0) @binding(6) var<storage, read_write> outputData_v_lifetime: array<f32>;

fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    let input = inputData[idx];

    var v_position: vec2<f32>;
    var v_velocity: vec2<f32>;
    var v_spawntime: f32;
    var v_lifetime: f32;

    if (input.a_spawntime == 0.0 || (u_time - input.a_spawntime > input.a_lifetime) || input.a_position.y < -0.5) {
        // Generate a new particle
        v_position = vec2<f32>(0.0, 0.0);
        v_velocity = vec2<f32>(rand(vec2<f32>(input.a_ID, 0.0)) - 0.5, rand(vec2<f32>(input.a_ID, input.a_ID)));
        v_spawntime = u_time;
        v_lifetime = 5000.0;
    } else {
        v_velocity = input.a_velocity + 0.01 * u_acceleration;
        v_position = input.a_position + 0.01 * v_velocity;
        v_spawntime = input.a_spawntime;
        v_lifetime = input.a_lifetime;
    }

    outputData_v_position[idx] = v_position;
    outputData_v_velocity[idx] = v_velocity;
    outputData_v_spawntime[idx] = v_spawntime;
    outputData_v_lifetime[idx] = v_lifetime;
}

