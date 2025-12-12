import { attribute, fragment, normalize, precision, return_, texture2D, uniform, varying, vec2, vec3, vec4, vertex, dot, clamp, mat4 } from '@feng3d/tsl';

// Vertex shader 的 attribute
const position = vec3(attribute('position'));
const normal = vec3(attribute('normal'));
const uv = vec2(attribute('uv'));

// Vertex shader 的 uniform
const projection = mat4(uniform('projection'));
const view = mat4(uniform('view'));

// Fragment shader 的 uniform
const texture = uniform('texture');

// Varying variables
const vUv = vec2(varying('vUv'));
const vNormal = vec3(varying('vNormal'));

// Vertex shader 入口函数
export const vertexShader = vertex('main', () => {
    vUv.assign(uv);
    vNormal.assign(normal);
    return_(projection.mul(view).mul(vec4(position, 1)));
});

// Fragment shader 入口函数
export const fragmentShader = fragment('main', () => {
    precision('mediump', 'float');
    
    const tex = texture2D(texture, vUv.mul(1.0)).xyz;
    const lightDir = normalize(vec3(0.4, 0.9, 0.3));
    
    let n = vec3(vNormal);
    
    const ambient = vec3(0.3).mul(tex);
    // 使用abs确保无论法线方向如何，都能得到正确的漫反射光照
    const diffuse = vec3(0.7).mul(tex).mul(clamp(Math.abs(dot(n, lightDir)), 0.0, 1.0));
    
    return_(vec4(ambient.add(diffuse), 1.0));
});
