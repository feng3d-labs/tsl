#version 300 es

precision highp float;
in vec3 vWorldPosition;
in vec3 vSunDirection;
in float vSunfade;
in vec3 vBetaR;
in vec3 vBetaM;
in float vSunE;
uniform vec3 cameraPosition;
uniform float mieDirectionalG;
uniform vec3 up;

const float pi = 3.141592653589793238462643383279502884197169;
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
const float ONE_OVER_FOURPI = 0.07957747154594767;

layout(location = 0) out highp vec4 pc_fragColor;

void main() {
    vec3 direction = normalize(vWorldPosition - cameraPosition);
    float zenithAngle = acos(max(dot(up, direction), 0.0));
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
    float sR = rayleighZenithLength * inverse;
    float sM = mieZenithLength * inverse;
    vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));
    float cosTheta = dot(direction, vSunDirection);
    float rPhase = THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta * 0.5 + 0.5, 2.0));
    vec3 betaRTheta = vBetaR * rPhase;
    float g2 = pow(mieDirectionalG, 2.0);
    float hgDenom = pow(1.0 - 2.0 * mieDirectionalG * cosTheta + g2, 1.5);
    float mPhase = ONE_OVER_FOURPI * ((1.0 - g2) / hgDenom);
    vec3 betaMTheta = vBetaM * mPhase;
    vec3 betaSum = vBetaR + vBetaM;
    vec3 betaThetaSum = betaRTheta + betaMTheta;
    vec3 betaRatio = betaThetaSum / betaSum;
    vec3 Lin = pow(vSunE * betaRatio * (1.0 - Fex), vec3(1.5));
    vec3 FexPow = pow(vSunE * betaRatio * Fex, vec3(1.0 / 2.0));
    float upDotSun = dot(up, vSunDirection);
    float mixFactor = clamp(pow(1.0 - upDotSun, 5.0), 0.0, 1.0);
    vec3 LinMixed = Lin * mix(vec3(1.0), FexPow, mixFactor);
    float theta = acos(direction.y);
    float phi = atan(direction.z, direction.x);
    vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
    vec3 L0 = vec3(0.1) * Fex;
    float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    vec3 L0WithSun = L0 + (vSunE * 19000.0 * Fex) * sundisk;
    vec3 texColor = (LinMixed + L0WithSun) * 0.04 + vec3(0.0, 0.0003, 0.00075);
    vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * vSunfade))));
    pc_fragColor = vec4(retColor, 1.0);
}

