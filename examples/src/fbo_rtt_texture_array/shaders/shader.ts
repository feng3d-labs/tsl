import { assign, attribute, builtin, color, fragment, fragmentOutput, int, mat4, precision, return_, sampler, texture, uniform, varying, varyingStruct, vec2, vec4, vertex } from '@feng3d/tsl';

const position = vec2(attribute('position'));
const textureCoordinates = vec2(attribute('textureCoordinates'));

const mvp = mat4(uniform('mvp'));

const vLayer = varyingStruct({
    vPosition: vec4(builtin('position')),
    v_st: vec2(varying()),
});

export const layerVertexShader = vertex('main', () =>
{
    assign(vLayer.v_st, textureCoordinates);
    assign(vLayer.vPosition, mvp.multiply(vec4(position, 0.0, 1.0)));
});

const diffuse = sampler('diffuse');
const layer = int(uniform('layer'));

export const layerFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('lowp', 'sampler2DArray');

    return_(texture(diffuse, vLayer.v_st, layer));
});

const vMultipleOutput = varyingStruct({
    vPosition: vec4(builtin('position')),
});

export const multipleOutputVertexShader = vertex('main', () =>
{
    assign(vMultipleOutput.vPosition, mvp.multiply(vec4(position, 0.0, 1.0)));
});

const f = fragmentOutput({
    red: vec4(color(0)),
    green: vec4(color(1)),
    blue: vec4(color(2)),
});

export const multipleOutputFragmentShader = fragment('main', () =>
{
    assign(f.red, vec4(0.5, 0.0, 0.0, 1.0));
    assign(f.green, vec4(0.0, 0.3, 0.0, 1.0));
    assign(f.blue, vec4(0.0, 0.0, 0.8, 1.0));
});

