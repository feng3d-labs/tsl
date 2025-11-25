@group(0) @binding(8) var<uniform> cameraPosition: vec3<f32>;
@group(0) @binding(9) var<uniform> mieDirectionalG: f32;
@group(0) @binding(7) var<uniform> up: vec3<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vWorldPosition: vec3<f32>,
    @location(1) vSunDirection: vec3<f32>,
    @location(2) vSunfade: f32,
    @location(3) vBetaR: vec3<f32>,
    @location(4) vBetaM: vec3<f32>,
    @location(5) vSunE: f32,
};

const pi: f32 = 3.141592653589793238462643383279502884197169;
const rayleighZenithLength: f32 = 8.4E3;
const mieZenithLength: f32 = 1.25E3;
const sunAngularDiameterCos: f32 = 0.999956676946448443553574619906976478926848692873900859324;
const THREE_OVER_SIXTEENPI: f32 = 0.05968310365946075;
const ONE_OVER_FOURPI: f32 = 0.07957747154594767;

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
    let direction = normalize(input.vWorldPosition - cameraPosition);
    let zenithAngle = acos(max(dot(up, direction), 0.0));
    let inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
    let sR = rayleighZenithLength * inverse;
    let sM = mieZenithLength * inverse;
    let Fex = exp(-(input.vBetaR * sR + input.vBetaM * sM));
    let cosTheta = dot(direction, input.vSunDirection);
    let rPhase = THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta * 0.5 + 0.5, 2.0));
    let betaRTheta = input.vBetaR * rPhase;
    let g2 = pow(mieDirectionalG, 2.0);
    let hgDenom = pow(1.0 - 2.0 * mieDirectionalG * cosTheta + g2, 1.5);
    let mPhase = ONE_OVER_FOURPI * ((1.0 - g2) / hgDenom);
    let betaMTheta = input.vBetaM * mPhase;
    let betaSum = input.vBetaR + input.vBetaM;
    let betaThetaSum = betaRTheta + betaMTheta;
    let betaRatio = betaThetaSum / betaSum;
    let Lin = pow(input.vSunE * betaRatio * (1.0 - Fex), vec3<f32>(1.5));
    let FexPow = pow(input.vSunE * betaRatio * Fex, vec3<f32>(1.0 / 2.0));
    let upDotSun = dot(up, input.vSunDirection);
    let mixFactor = clamp(pow(1.0 - upDotSun, 5.0), 0.0, 1.0);
    let LinMixed = Lin * mix(vec3<f32>(1.0), FexPow, mixFactor);
    let theta = acos(direction.y);
    let phi = atan2(direction.z, direction.x);
    let uv = vec2<f32>(phi, theta) / vec2<f32>(2.0 * pi, pi) + vec2<f32>(0.5, 0.0);
    let L0 = vec3<f32>(0.1) * Fex;
    let sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    let L0WithSun = L0 + (input.vSunE * 19000.0 * Fex) * sundisk;
    let texColor = (LinMixed + L0WithSun) * 0.04 + vec3<f32>(0.0, 0.0003, 0.00075);
    let retColor = pow(texColor, vec3<f32>(1.0 / (1.2 + (1.2 * input.vSunfade))));
    return vec4<f32>(retColor, 1.0);
}

