import { Builtin, builtin, float, fragment, precision, return_, sampler, texture, uint, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

const gl_VertexID = uint(builtin('gl_VertexID'))

export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(vec4(2.0 * float(gl_VertexID.mod(2u)) - 1.0, 2.0 * float(gl_VertexID.mod(2u)) - 1.0, 0.0, 1.0));
});

const diffuse = sampler('diffuse');
const u_imageSize = vec2(uniform('u_imageSize'));
const gl_FragCoord = vec2(builtin('gl_FragCoord'));

export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    return_(texture(diffuse, vec2(gl_FragCoord.x, u_imageSize.y.subtract(gl_FragCoord.y)).divide(u_imageSize)));
});
