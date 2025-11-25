import { acos, assign, atan, attribute, builtin, clamp, cos, dot, exp, fragment, mat4, max, mix, normalize, pow, return_, smoothstep, step, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));

// Vertex shader 的 uniforms
const modelMatrix = mat4(uniform('modelMatrix'));
const modelViewMatrix = mat4(uniform('modelViewMatrix'));
const projectionMatrix = mat4(uniform('projectionMatrix'));
const sunPosition = vec3(uniform('sunPosition'));
const rayleigh = uniform('rayleigh');
const turbidity = uniform('turbidity');
const mieCoefficient = uniform('mieCoefficient');
const up = vec3(uniform('up'));

// Vertex shader 的 builtin
const vPosition = vec4(builtin('position', 'position_vec4'));

// Varyings
const vWorldPosition = vec3(varying('vWorldPosition'));
const vSunDirection = vec3(varying('vSunDirection'));
const vSunfade = varying('vSunfade');
const vBetaR = vec3(varying('vBetaR'));
const vBetaM = vec3(varying('vBetaM'));
const vSunE = varying('vSunE');

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
    assign(vWorldPosition, worldPosition.xyz); // worldPosition.xyz 返回 Vec3
    assign(vPosition, projectionMatrix.multiply(modelViewMatrix).multiply(vec4(position, 1.0)));
    // gl_Position.z = gl_Position.w (设置 z 为 w，使天空盒始终在远平面)
    const posZ = var_('posZ', vPosition.w);
    assign(vPosition, vec4(vPosition.x, vPosition.y, posZ, vPosition.w));

    const sunDir = var_('sunDir', normalize(sunPosition));
    assign(vSunDirection, sunDir);

    // sunIntensity: EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(clamp(zenithAngleCos, -1.0, 1.0))) / steepness)))
    const zenithAngleCos = var_('zenithAngleCos', dot(sunDir, up));
    const clamped = var_('clamped', clamp(zenithAngleCos, -1.0, 1.0));
    const acosClamped = var_('acosClamped', acos(clamped));
    const sunE = var_('sunE', EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness))));
    assign(vSunE, sunE);

    const sunfade = var_('sunfade', 1.0 - clamp(1.0 - exp(sunPosition.y / 450000.0), 0.0, 1.0));
    assign(vSunfade, sunfade);

    const rayleighCoefficient = var_('rayleighCoefficient', rayleigh - (1.0 * (1.0 - sunfade)));
    const betaR = var_('betaR', totalRayleigh.multiply(rayleighCoefficient));
    assign(vBetaR, betaR);

    // totalMie: 0.434 * (0.2 * T) * 10E-18 * MieConst
    const c = var_('c', (0.2 * turbidity) * 10E-18);
    const totalMieValue = var_('totalMieValue', 0.434 * c * MieConst);
    const betaM = var_('betaM', totalMieValue.multiply(mieCoefficient));
    assign(vBetaM, betaM);
});

// Fragment shader 的 uniforms
const cameraPosition = vec3(uniform('cameraPosition'));
const mieDirectionalG = uniform('mieDirectionalG');
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
    const zenithAngle = var_('zenithAngle', acos(max(dot(upFrag, direction), 0.0)));
    const inverse = var_('inverse', 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / piFrag), -1.253)));
    const sR = var_('sR', rayleighZenithLength * inverse);
    const sM = var_('sM', mieZenithLength * inverse);
    const Fex = var_('Fex', exp((vBetaR.multiply(sR).add(vBetaM.multiply(sM))).multiply(-1.0)));
    const cosTheta = var_('cosTheta', dot(direction, vSunDirection));
    
    // rayleighPhase: THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta * 0.5 + 0.5, 2.0))
    const rPhase = var_('rPhase', THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta * 0.5 + 0.5, 2.0)));
    const betaRTheta = var_('betaRTheta', vBetaR.multiply(rPhase));
    
    // hgPhase: ONE_OVER_FOURPI * ((1.0 - g2) / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5))
    const g2 = var_('g2', pow(mieDirectionalG, 2.0));
    const hgDenom = var_('hgDenom', pow(1.0 - 2.0 * mieDirectionalG * cosTheta + g2, 1.5));
    const mPhase = var_('mPhase', ONE_OVER_FOURPI * ((1.0 - g2) / hgDenom));
    const betaMTheta = var_('betaMTheta', vBetaM.multiply(mPhase));
    
    const betaSum = var_('betaSum', vBetaR.add(vBetaM));
    const betaThetaSum = var_('betaThetaSum', betaRTheta.add(betaMTheta));
    const betaRatio = var_('betaRatio', betaThetaSum.divide(betaSum));
    const Lin = var_('Lin', pow(vSunE * betaRatio.multiply(1.0 - Fex), vec3(1.5)));
    
    const FexPow = var_('FexPow', pow(vSunE * betaRatio.multiply(Fex), vec3(1.0 / 2.0)));
    const upDotSun = var_('upDotSun', dot(upFrag, vSunDirection));
    const mixFactor = var_('mixFactor', clamp(pow(1.0 - upDotSun, 5.0), 0.0, 1.0));
    const LinMixed = var_('LinMixed', Lin.multiply(mix(vec3(1.0), FexPow, mixFactor)));
    
    const theta = var_('theta', acos(direction.y));
    const phi = var_('phi', atan(direction.z, direction.x));
    const uv = var_('uv', vec2(phi, theta).divide(vec2(2.0 * piFrag, piFrag)).add(vec2(0.5, 0.0)));
    
    const L0 = var_('L0', vec3(0.1).multiply(Fex));
    const sundisk = var_('sundisk', smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta));
    const L0WithSun = var_('L0WithSun', L0.add((vSunE * 19000.0 * Fex).multiply(sundisk)));
    const texColor = var_('texColor', (LinMixed.add(L0WithSun)).multiply(0.04).add(vec3(0.0, 0.0003, 0.00075)));
    const retColor = var_('retColor', pow(texColor, vec3(1.0 / (1.2 + (1.2 * vSunfade)))));
    
    // sRGBTransferOETF - 简化版本，直接返回颜色
    const finalColor = var_('finalColor', vec4(retColor, 1.0));
    return_(finalColor);
});
