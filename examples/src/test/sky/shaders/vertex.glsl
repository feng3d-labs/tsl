#version 300 es

precision highp float;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 sunPosition;
uniform float rayleigh;
uniform float turbidity;
uniform float mieCoefficient;
uniform vec3 up;
in vec3 position;
out vec3 vWorldPosition;
out vec3 vSunDirection;
out float vSunfade;
out vec3 vBetaR;
out vec3 vBetaM;
out float vSunE;

const float e = 2.71828182845904523536028747135266249775724709369995957;
const float pi = 3.141592653589793238462643383279502884197169;
const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;
const float EE = 1000.0;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
    vSunDirection = normalize(sunPosition);
    float zenithAngleCos = dot(vSunDirection, up);
    float clamped = clamp(zenithAngleCos, -1.0, 1.0);
    float acosClamped = acos(clamped);
    vSunE = EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)));
    vSunfade = 1.0 - clamp(1.0 - exp(sunPosition.y / 450000.0), 0.0, 1.0);
    float rayleighCoefficient = rayleigh - (1.0 * (1.0 - vSunfade));
    vBetaR = totalRayleigh * rayleighCoefficient;
    float c = (0.2 * turbidity) * 10E-18;
    vec3 totalMieValue = 0.434 * c * MieConst;
    vBetaM = totalMieValue * mieCoefficient;
}

