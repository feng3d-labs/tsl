@group(0) @binding(0) var<uniform> modelMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelViewMatrix: mat4x4<f32>;
@group(0) @binding(2) var<uniform> projectionMatrix: mat4x4<f32>;
@group(0) @binding(3) var<uniform> sunPosition: vec3<f32>;
@group(0) @binding(4) var<uniform> rayleigh: f32;
@group(0) @binding(5) var<uniform> turbidity: f32;
@group(0) @binding(6) var<uniform> mieCoefficient: f32;
@group(0) @binding(7) var<uniform> up: vec3<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vWorldPosition: vec3<f32>,
    @location(1) vSunDirection: vec3<f32>,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3<f32>,
    @location(4) vBetaM: vec3<f32>,
    @location(5) vSunE: f32,
};

const totalRayleigh: vec3<f32> = vec3<f32>(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
const MieConst: vec3<f32> = vec3<f32>(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
const cutoffAngle: f32 = 1.6110731556870734;
const steepness: f32 = 1.5;
const EE: f32 = 1000.0;

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let worldPosition = modelMatrix * vec4<f32>(input.position, 1.0);
    output.vWorldPosition = worldPosition.xyz;
    output.position = projectionMatrix * modelViewMatrix * vec4<f32>(input.position, 1.0);
    output.position.z = output.position.w;
    output.vSunDirection = normalize(sunPosition);
    let zenithAngleCos = dot(output.vSunDirection, up);
    let clamped = clamp(zenithAngleCos, -1.0, 1.0);
    let acosClamped = acos(clamped);
    output.vSunE = EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)));
    output.vSunfade = 1.0 - clamp(1.0 - exp(sunPosition.y / 450000.0), 0.0, 1.0);
    let rayleighCoefficient = rayleigh - (1.0 * (1.0 - output.vSunfade));
    output.vBetaR = totalRayleigh * rayleighCoefficient;
    let c = (0.2 * turbidity) * 10E-18;
    let totalMieValue = 0.434 * c * MieConst;
    output.vBetaM = totalMieValue * mieCoefficient;
    return output;
}

