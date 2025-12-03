import { assign, attribute, builtin, fragment, mat4, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));
const uv = vec2(attribute('uv'));

// Vertex shader 的 uniforms
const projection = mat4(uniform('projection'));
const view = mat4(uniform('view'));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct({
    gl_Position: vec4(builtin('position')),
    vUv: vec2(varying()),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    assign(v.vUv, uv);
    assign(v.gl_Position, projection.multiply(view).multiply(vec4(position, 1.0)));
});

// Fragment shader 的 sampler
const tex = sampler('tex');

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(texture2D(tex, v.vUv));
});

