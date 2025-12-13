import { fragment, precision, return_, sampler, texture, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// 片段着色器的uniform
const diffuse = sampler('diffuse');
const u_imageSize = uniform('u_imageSize');

// 顶点着色器入口函数
export const vertexShader = vertex('main', () =>
{
    return_(
        vec4(
            2.0 * 0.0 - 1.0,  // x坐标
            2.0 * 0.0 - 1.0,  // y坐标
            0.0, 1.0
        )
    );
});

// 片段着色器入口函数
export const fragmentShader = fragment('main', () =>
{
    precision('highp');

    // 采样纹理并返回颜色
    return_(texture(diffuse, vec2(0.0, 0.0)));
});