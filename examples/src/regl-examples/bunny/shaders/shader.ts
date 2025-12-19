import { attribute, builtin, fragment, mat4, return_, uniform, var_, varying, varyingStruct, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));

// Vertex shader 的 uniforms
const model = mat4(uniform('model'));
const view = mat4(uniform('view'));
const projection = mat4(uniform('projection'));

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct({
    gl_Position: vec4(builtin('position')),
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    v.gl_Position.assign(projection.multiply(view).multiply(model).multiply(vec4(position, 1.0)));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    return_(vec4(1.0, 1.0, 1.0, 1.0));
});

