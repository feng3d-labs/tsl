import { attribute, fragment, gl_Position, mat4, return_, sampler2D, texture2D, uniform, varying, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));
const uv = vec2(attribute('uv'));

// Vertex shader 的 uniforms
const projection = mat4(uniform('projection'));
const view = mat4(uniform('view'));

// Varying 变量
const vUv = vec2(varying('vUv'));

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    vUv.assign(uv);
    gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0)));
});

// Fragment shader 的 sampler
const tex = sampler2D(uniform('tex'));

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(texture2D(tex, vUv));
});
