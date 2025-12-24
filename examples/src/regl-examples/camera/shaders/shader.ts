import { attribute, float, fragment, gl_Position, max, mat4, return_, uniform, var_, varying, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attributes
const position = vec3(attribute('position'));
const normal = vec3(attribute('normal'));

// Vertex shader 的 uniforms
const projection = mat4(uniform('projection'));
const view = mat4(uniform('view'));

// Varying 变量
const vnormal = vec3(varying('vnormal'));

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    vnormal.assign(normal);
    gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0)));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    // 使用 max(vnormal, -vnormal) 来实现 abs(vec3)
    // 注意：在 GLSL 中可以直接使用 abs()，但 TSL 中需要手动实现
    const negNormal = float(-1.0).multiply(vnormal);
    const absX = max(vnormal.x, negNormal.x);
    const absY = max(vnormal.y, negNormal.y);
    const absZ = max(vnormal.z, negNormal.z);
    // 使用 var_ 创建 vec3，因为 vec3 构造函数不支持 (Float, Float, Float)
    const absNormal = var_('absNormal', vec3(0, 0, 0));
    absNormal.x.assign(absX);
    absNormal.y.assign(absY);
    absNormal.z.assign(absZ);

    return_(vec4(absNormal, 1.0));
});
