import { acos, add, assign, atan, attribute, builtin, clamp, cos, divide, dot, exp, float, fragment, mat4, max, mix, multiply, normalize, pow, return_, smoothstep, step, subtract, uniform, var_, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

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
    const worldPosition = var_('worldPosition', multiply(modelMatrix, vec4(position, 1.0)));
    assign(vWorldPosition, worldPosition.xyz);
    assign(vPosition, multiply(multiply(projectionMatrix, modelViewMatrix) as any, vec4(position, 1.0)));
    assign(vPosition, vec4(vPosition.x, vPosition.y, vPosition.w, vPosition.w));

    const vSunDirectionValue = var_('vSunDirection', normalize(sunPosition));
    assign(vSunDirection, vSunDirectionValue);
    const zenithAngleCos = var_('zenithAngleCos', dot(vSunDirectionValue, up));
    const clamped = var_('clamped', clamp(zenithAngleCos, -1.0, 1.0));
    const acosClamped = var_('acosClamped', acos(clamped));
    assign(vSunE, multiply(float(EE), max(float(0.0), subtract(float(1.0), exp(multiply(float(-1.0), divide(subtract(float(cutoffAngle), acosClamped), float(steepness))))))));

    const sunfade = var_('sunfade', subtract(float(1.0), clamp(subtract(float(1.0), exp(divide(sunPosition.y, float(450000.0)))), float(0.0), float(1.0))));
    assign(vSunfade, sunfade);
    const rayleighCoefficient = var_('rayleighCoefficient', subtract(rayleigh, multiply(float(1.0), subtract(float(1.0), sunfade))));
    assign(vBetaR, multiply(totalRayleigh, rayleighCoefficient));

    const c = var_('c', multiply(multiply(float(0.2), turbidity), float(10E-18)));
    const totalMieValue = var_('totalMieValue', multiply(multiply(float(0.434), c) as any, MieConst));
    assign(vBetaM, multiply(totalMieValue, mieCoefficient));
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
    const direction = var_('direction', normalize(subtract(vWorldPosition, cameraPosition)));
    const zenithAngle = var_('zenithAngle', acos(max(dot(upFrag, direction), float(0.0))));
    const inverse = var_('inverse', divide(float(1.0), add(cos(zenithAngle), multiply(float(0.15), pow(subtract(float(93.885), divide(multiply(zenithAngle, float(180.0)), float(piFrag))), float(-1.253))))));
    const sR = var_('sR', multiply(float(rayleighZenithLength), inverse));
    const sM = var_('sM', multiply(float(mieZenithLength), inverse));
    const Fex = var_('Fex', exp(multiply(float(-1.0), add(multiply(vBetaR, sR as any), multiply(vBetaM, sM as any)))));
    const cosTheta = var_('cosTheta', dot(direction, vSunDirection));
    const rPhase = var_('rPhase', multiply(float(THREE_OVER_SIXTEENPI), add(float(1.0), pow(add(multiply(cosTheta, float(0.5)), float(0.5)), float(2.0)))));
    const betaRTheta = var_('betaRTheta', multiply(vBetaR, rPhase));
    const g2 = var_('g2', pow(mieDirectionalG, float(2.0)));
    const hgDenom = var_('hgDenom', pow(add(subtract(float(1.0), multiply(multiply(float(2.0), mieDirectionalG), cosTheta)), g2), float(1.5)));
    const mPhase = var_('mPhase', multiply(float(ONE_OVER_FOURPI), divide(subtract(float(1.0), g2), hgDenom)));
    const betaMTheta = var_('betaMTheta', multiply(vBetaM, mPhase));
    const betaSum = var_('betaSum', add(vBetaR, vBetaM));
    const betaThetaSum = var_('betaThetaSum', add(betaRTheta, betaMTheta));
    const betaRatio = var_('betaRatio', divide(betaThetaSum, betaSum) as any);
    const Lin = var_('Lin', pow(multiply(multiply(vSunE, betaRatio as any), subtract(float(1.0), Fex)) as any, vec3(1.5, 1.5, 1.5) as any) as any);
    const FexPow = var_('FexPow', pow(multiply(multiply(vSunE, betaRatio as any), Fex) as any, vec3(0.5, 0.5, 0.5) as any) as any);
    const upDotSun = var_('upDotSun', dot(upFrag, vSunDirection));
    const mixFactor = var_('mixFactor', clamp(pow(subtract(float(1.0), upDotSun), float(5.0)), float(0.0), float(1.0)));
    const LinMixed = var_('LinMixed', multiply(Lin, mix(vec3(1.0, 1.0, 1.0), FexPow, mixFactor) as any));
    const theta = var_('theta', acos(direction.y));
    const phi = var_('phi', atan(direction.z, direction.x));
    const uv = var_('uv', add(divide(vec2(phi, theta) as any, vec2(multiply(float(2.0), float(piFrag)), float(piFrag)) as any), vec2(float(0.5), float(0.0))) as any);
    const L0 = var_('L0', multiply(vec3(0.1, 0.1, 0.1) as any, Fex) as any);
    const sundisk = var_('sundisk', smoothstep(float(sunAngularDiameterCos), add(float(sunAngularDiameterCos), float(0.00002)), cosTheta));
    const L0WithSun = var_('L0WithSun', add(L0, multiply(multiply(multiply(vSunE, float(19000.0)), Fex), sundisk) as any));
    const texColor = var_('texColor', add(multiply(add(LinMixed, L0WithSun), float(0.04)) as any, vec3(0.0, 0.0003, 0.00075)) as any);
    const retColor = var_('retColor', pow(texColor, vec3(divide(float(1.0), add(float(1.2), multiply(float(1.2), vSunfade))), divide(float(1.0), add(float(1.2), multiply(float(1.2), vSunfade))), divide(float(1.0), add(float(1.2), multiply(float(1.2), vSunfade))))) as any);
    return_(vec4(retColor, float(1.0)) as any);
});
