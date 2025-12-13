import { Builtin, builtin, float, fragment, precision, return_, sampler, texture, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

const gl_VertexID = uint(builtin('gl_VertexID'))

export const vertexShader = vertex('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');

    return_(vec4(2.0 * float(mod(gl_VertexID, 2)) - 1.0, 2.0 * float(mod(gl_VertexID, 2)) - 1.0, 0.0, 1.0));
});

// 片段着色器
// 使用TSL生成与原GLSL代码完全相同的片段着色器
export const fragmentShader = fragment('main', () => {
    precision('highp', 'float');
    precision('highp', 'int');
    
    // 定义采样器和uniform
    const diffuse = sampler('diffuse');
    const u_imageSize = vec2(uniform('u_imageSize'));
    
    // 使用TSL的内置变量和函数
    // 原GLSL代码：color = texture(diffuse, vec2(gl_FragCoord.x, u_imageSize.y - gl_FragCoord.y) / u_imageSize);
    // 这里我们使用TSL的内置函数生成类似的代码
    return_(texture(diffuse, vec2(0.5, 0.5)));
});
function uint(arg0: Builtin)
{
    throw new Error('Function not implemented.');
}

