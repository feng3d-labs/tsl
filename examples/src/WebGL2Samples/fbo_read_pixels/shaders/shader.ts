import { attribute, fragColor, fragment, fragmentOutput, gl_Position, int, mat4, precision, return_, sampler2DArray, texture, uniform, varying, vec2, vec4, vertex } from '@feng3d/tsl';

const position = vec2(attribute('position'));
const textureCoordinates = vec2(attribute('textureCoordinates'));

const mvp = mat4(uniform('mvp'));

const v_st = vec2(varying('v_st'));

export const layerVertexShader = vertex('main', () =>
{
    v_st.assign(textureCoordinates);
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

const diffuse = sampler2DArray(uniform('diffuse'));
const layer = int(uniform('layer'));

export const layerFragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');
    precision('lowp', 'sampler2DArray');

    return_(texture(diffuse, v_st, layer));
});

export const multipleOutputVertexShader = vertex('main', () =>
{
    gl_Position.assign(mvp.multiply(vec4(position, 0.0, 1.0)));
});

const f = fragmentOutput({
    red: vec4(fragColor(0)),
    green: vec4(fragColor(1)),
    blue: vec4(fragColor(2)),
});

export const multipleOutputFragmentShader = fragment('main', () =>
{
    f.red.assign(vec4(0.5, 0.0, 0.0, 1.0));
    f.green.assign(vec4(0.0, 0.3, 0.0, 1.0));
    f.blue.assign(vec4(0.0, 0.0, 0.8, 1.0));

    return_(f);
});
