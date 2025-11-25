import { acos, assign, atan, attribute, builtin, clamp, cos, dot, exp, float, fragment, mat4, max, mix, normalize, pow, return_, smoothstep, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));

// Vertex shader 的 uniforms
const modelMatrix = mat4(uniform('modelMatrix'));
const modelViewMatrix = mat4(uniform('modelViewMatrix'));
const projectionMatrix = mat4(uniform('projectionMatrix'));
const sunPosition = vec3(uniform('sunPosition'));
const rayleigh = float(uniform('rayleigh'));
const turbidity = float(uniform('turbidity'));
const mieCoefficient = float(uniform('mieCoefficient'));
const up = vec3(uniform('up'));

// Vertex shader 的 builtin
const vPosition = vec4(builtin('position', 'position_vec4'));

// Varyings
const vWorldPosition = vec3(varying('vWorldPosition'));
const vSunDirection = vec3(varying('vSunDirection'));
const vSunfade = float(varying('vSunfade'));
const vBetaR = vec3(varying('vBetaR'));
const vBetaM = vec3(varying('vBetaM'));
const vSunE = float(varying('vSunE'));

// Constants
const e = 2.71828182845904523536028747135266249775724709369995957;
const pi = 3.141592653589793238462643383279502884197169;
const totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
const MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
const cutoffAngle = 1.6110731556870734;
const steepness = 1.5;
const EE = 1000.0;

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    const worldPosition = var_('worldPosition', modelMatrix.multiply(vec4(position, 1.0)));
    assign(vWorldPosition, worldPosition.xyz);
    assign(vPosition, projectionMatrix.multiply(modelViewMatrix).multiply(vec4(position, 1.0)));
    assign(vPosition, vec4(vPosition.x, vPosition.y, vPosition.w, vPosition.w));

    const vSunDirectionValue = var_('vSunDirection', normalize(sunPosition));
    assign(vSunDirection, vSunDirectionValue);
    const zenithAngleCos = var_('zenithAngleCos', dot(vSunDirectionValue, up));
    const clamped = var_('clamped', clamp(zenithAngleCos, -1.0, 1.0));
    const acosClamped = var_('acosClamped', acos(clamped));
    assign(vSunE, float(EE).multiply(max(float(0.0), float(1.0).subtract(exp(float(-1.0).multiply(float(cutoffAngle).subtract(acosClamped).divide(float(steepness))))))));

    const sunfade = var_('sunfade', float(1.0).subtract(clamp(float(1.0).subtract(exp(sunPosition.y.divide(float(450000.0)))), float(0.0), float(1.0))));
    assign(vSunfade, sunfade);
    const rayleighCoefficient = var_('rayleighCoefficient', rayleigh.subtract(float(1.0).multiply(float(1.0).subtract(sunfade))));
    assign(vBetaR, totalRayleigh.multiply(rayleighCoefficient));

    const c = var_('c', float(0.2).multiply(turbidity).multiply(float(10E-18)));
    const totalMieValue = var_('totalMieValue', float(0.434).multiply(c.multiply(MieConst)));
    assign(vBetaM, totalMieValue.multiply(mieCoefficient));
});

// Fragment shader 的 uniforms
const cameraPosition = vec3(uniform('cameraPosition'));
const mieDirectionalG = float(uniform('mieDirectionalG'));
const upFrag = vec3(uniform('up'));

// Fragment shader constants
const piFrag = 3.141592653589793238462643383279502884197169;
const rayleighZenithLength = 8.4E3;
const mieZenithLength = 1.25E3;
const sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
const THREE_OVER_SIXTEENPI = 0.05968310365946075;
const ONE_OVER_FOURPI = 0.07957747154594767;

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    const direction = var_('direction', normalize(vWorldPosition.subtract(cameraPosition)));
    const zenithAngle = var_('zenithAngle', acos(max(dot(upFrag, direction), float(0.0))));
    const inverse = var_('inverse', float(1.0).divide(cos(zenithAngle).add(float(0.15).multiply(pow(float(93.885).subtract(zenithAngle.multiply(float(180.0)).divide(float(piFrag))), float(-1.253))))));
    const sR = var_('sR', float(rayleighZenithLength).multiply(inverse));
    const sM = var_('sM', float(mieZenithLength).multiply(inverse));
    const Fex = var_('Fex', exp(float(-1.0).multiply(vBetaR.multiply(sR).add(vBetaM.multiply(sM)))));
    const cosTheta = var_('cosTheta', dot(direction, vSunDirection));
    const rPhase = var_('rPhase', float(THREE_OVER_SIXTEENPI).multiply(float(1.0).add(pow(cosTheta.multiply(float(0.5)).add(float(0.5)), float(2.0)))));
    const betaRTheta = var_('betaRTheta', vBetaR.multiply(rPhase));
    const g2 = var_('g2', pow(mieDirectionalG, float(2.0)));
    const hgDenom = var_('hgDenom', pow(float(1.0).subtract(float(2.0).multiply(mieDirectionalG).multiply(cosTheta)).add(g2), float(1.5)));
    const mPhase = var_('mPhase', float(ONE_OVER_FOURPI).multiply(float(1.0).subtract(g2).divide(hgDenom)));
    const betaMTheta = var_('betaMTheta', vBetaM.multiply(mPhase));
    const betaSum = var_('betaSum', vBetaR.add(vBetaM));
    const betaThetaSum = var_('betaThetaSum', betaRTheta.add(betaMTheta));
    const betaRatio = var_('betaRatio', betaThetaSum.divide(betaSum));
    const Lin = var_('Lin', pow(betaRatio.multiply(vSunE as any).multiply(float(1.0).subtract(Fex)), vec3(1.5, 1.5, 1.5)));
    const FexPow = var_('FexPow', pow(betaRatio.multiply(vSunE as any).multiply(Fex), vec3(0.5, 0.5, 0.5)));
    const upDotSun = var_('upDotSun', dot(upFrag, vSunDirection));
    const mixFactor = var_('mixFactor', clamp(pow(float(1.0).subtract(upDotSun), float(5.0)), float(0.0), float(1.0)));
    const LinMixed = var_('LinMixed', Lin.multiply(mix(vec3(1.0, 1.0, 1.0), FexPow, mixFactor)));
    const theta = var_('theta', acos(direction.y));
    const phi = var_('phi', atan(direction.z, direction.x));
    const uv = var_('uv', vec2(phi, theta).divide(vec2(float(2.0).multiply(float(piFrag)), float(piFrag))).add(vec2(0.5, 0.0)) as any);
    const L0 = var_('L0', vec3(0.1, 0.1, 0.1).multiply(Fex));
    const sundisk = var_('sundisk', smoothstep(float(sunAngularDiameterCos), float(sunAngularDiameterCos).add(float(0.00002)), cosTheta));
    const L0WithSun = var_('L0WithSun', L0.add(Fex.multiply(vSunE.multiply(float(19000.0))).multiply(sundisk)));
    const texColor = var_('texColor', LinMixed.add(L0WithSun).multiply(float(0.04)).add(vec3(0.0, 0.0003, 0.00075)));
    const retColor = var_('retColor', pow(texColor, vec3(float(1.0).divide(float(1.2).add(float(1.2).multiply(vSunfade))), float(1.0).divide(float(1.2).add(float(1.2).multiply(vSunfade))), float(1.0).divide(float(1.2).add(float(1.2).multiply(vSunfade))))));
    return_(vec4(retColor, 1.0));
});
