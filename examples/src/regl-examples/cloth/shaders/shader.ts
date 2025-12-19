import { attribute, bool, builtin, clamp, dot, float, fragment, if_, mat4, normalize, precision, return_, sampler, texture2D, uniform, var_, varying, varyingStruct, vec2, vec3, vec4, vertex } from '@feng3d/tsl';

// Vertex shader 的 attribute
const position = vec3(attribute('position')); // attribute vec3 position;
const normal = vec3(attribute('normal')); // attribute vec3 normal;
const uv = vec2(attribute('uv')); // attribute vec2 uv;

// Vertex shader 的 uniform
const projection = mat4(uniform('projection')); // uniform mat4 projection;
const view = mat4(uniform('view')); // uniform mat4 view;

// Fragment shader 的 uniform
const texture = sampler('texture'); // uniform sampler2D texture;

// VaryingStruct 用于在顶点和片段着色器之间传递数据
const v = varyingStruct({
    gl_Position: vec4(builtin('position')), // gl_Position
    vUv: vec2(varying()), // varying vec2 vUv;
    vNormal: vec3(varying()), // varying vec3 vNormal;
    gl_FrontFacing: bool(builtin('gl_FrontFacing')), // gl_FrontFacing
});

// Vertex shader 入口函数
export const vertexShader = vertex('main', () =>
{
    precision('mediump', 'float'); // precision mediump float;
    v.vUv.assign(uv); // vUv = uv;
    v.vNormal.assign(normal); // vNormal = normal;
    v.gl_Position.assign(projection.multiply(view).multiply(vec4(position, 1.0))); // gl_Position = projection * view * vec4(position, 1);
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('mediump', 'float'); // precision mediump float;

    const tex = var_('tex', texture2D(texture, v.vUv).xyz); // vec3 tex = texture2D(texture, vUv*1.0).xyz;
    const lightDir = var_('lightDir', normalize(vec3(0.4, 0.9, 0.3))); // vec3 lightDir = normalize(vec3(0.4, 0.9, 0.3));

    const n = var_('n', v.vNormal); // vec3 n = vNormal;

    // for the back faces we need to use the opposite normals.
    // if(gl_FrontFacing == false) {
    //     n = -n;
    // }
    if_(v.gl_FrontFacing.equals(false), () =>
    {
        n.assign(float(-1.0).multiply(n));
    });

    const dotProduct = var_('dotProduct', dot(n, lightDir)); // float dotProduct = dot(n, lightDir);
    const absDotProduct = var_('absDotProduct', clamp(dotProduct, 0.0, 1.0)); // float absDotProduct = clamp(dotProduct, 0.0, 1.0);

    const ambient = var_('ambient', vec3(0.3).multiply(tex)); // vec3 ambient = 0.3 * tex;
    const diffuse = var_('diffuse', vec3(0.7).multiply(tex).multiply(absDotProduct)); // vec3 diffuse = 0.7 * tex * absDotProduct;

    return_(vec4(ambient.add(diffuse), 1.0)); // gl_FragColor = vec4(ambient + diffuse, 1.0);
});
