/**
 * glsl_centroid 示例
 *
 * 演示 centroid 插值限定符在多重采样时的效果差异。
 *
 * centroid 插值确保插值在图元覆盖的采样点范围内进行，
 * 避免在三角形边缘产生外推值（可能超出顶点数据范围）。
 *
 * 此示例同时支持 WebGL 和 WebGPU 渲染。
 *
 * TSL 用法：
 * - 普通 varying: `float(varying('v_attr'))`
 * - centroid 插值: `float(varying('v_attr', { sampling: 'centroid' }))`
 */

import { PassEncoder, RenderPass, RenderPassDescriptor, RenderPassObject, RenderPipeline, RenderObject, Sampler, Texture, VertexAttributes, Viewport } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 导入原始着色器（调试用，取消注释可切换到手动着色器）
import renderVertGlsl from './shaders/render.vert.glsl';
import renderFragGlsl from './shaders/render.frag.glsl';
import renderCentroidVertGlsl from './shaders/render-centroid.vert.glsl';
import renderCentroidFragGlsl from './shaders/render-centroid.frag.glsl';
import splashVertGlsl from './shaders/splash.vert.glsl';
import splashFragGlsl from './shaders/splash.frag.glsl';
import renderVertWgsl from './shaders/render.vert.wgsl';
import renderFragWgsl from './shaders/render.frag.wgsl';
import renderCentroidVertWgsl from './shaders/render-centroid.vert.wgsl';
import renderCentroidFragWgsl from './shaders/render-centroid.frag.wgsl';
import splashVertWgsl from './shaders/splash.vert.wgsl';
import splashFragWgsl from './shaders/splash.frag.wgsl';

// 导入 TSL 着色器
import {
    renderVertexShader, renderFragmentShader,
    renderCentroidVertexShader, renderCentroidFragmentShader,
    splashVertexShader, splashFragmentShader
} from './shaders/shader';

/**
 * 初始化画布尺寸
 */
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 视口枚举
const VIEWPORTS = {
    LEFT: 0,   // 普通插值
    RIGHT: 1,  // centroid 插值
    MAX: 2,
};

// 程序枚举
const PROGRAM = {
    RENDER: 0,           // 普通渲染
    RENDER_CENTROID: 1,  // centroid 渲染
    SPLASH: 2,           // 显示到屏幕
    MAX: 3,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码（变量名与导入的相同，便于调试切换）
    // 调试时：注释下面的 TSL 生成代码，取消上面原始着色器导入的注释
    // const renderVertGlsl = renderVertexShader.toGLSL(2);
    // const renderFragGlsl = renderFragmentShader.toGLSL(2);
    // const renderVertWgsl = renderVertexShader.toWGSL();
    // const renderFragWgsl = renderFragmentShader.toWGSL(renderVertexShader);

    // const renderCentroidVertGlsl = renderCentroidVertexShader.toGLSL(2);
    // const renderCentroidFragGlsl = renderCentroidFragmentShader.toGLSL(2);
    // const renderCentroidVertWgsl = renderCentroidVertexShader.toWGSL();
    // const renderCentroidFragWgsl = renderCentroidFragmentShader.toWGSL(renderCentroidVertexShader);

    // const splashVertGlsl = splashVertexShader.toGLSL(2);
    // const splashFragGlsl = splashFragmentShader.toGLSL(2);
    // const splashVertWgsl = splashVertexShader.toWGSL();
    // const splashFragWgsl = splashFragmentShader.toWGSL(splashVertexShader);

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 画布尺寸
    const canvasSize = {
        x: webglCanvas.width,
        y: webglCanvas.height,
    };

    // 视口设置（左右两边）
    const viewportWidth = canvasSize.x / 2;
    const viewportHeight = canvasSize.y;

    const viewport: Viewport[] = [
        // 左侧：普通插值
        {
            x: 0,
            y: 0,
            width: viewportWidth,
            height: viewportHeight,
        },
        // 右侧：centroid 插值
        {
            x: viewportWidth,
            y: 0,
            width: viewportWidth,
            height: viewportHeight,
        },
    ];

    // 渲染管线
    const programs: RenderPipeline[] = [
        // 普通渲染管线
        {
            vertex: { glsl: renderVertGlsl, wgsl: renderVertWgsl },
            fragment: { glsl: renderFragGlsl, wgsl: renderFragWgsl },
            primitive: { topology: 'triangle-list' },
        },
        // centroid 渲染管线
        {
            vertex: { glsl: renderCentroidVertGlsl, wgsl: renderCentroidVertWgsl },
            fragment: { glsl: renderCentroidFragGlsl, wgsl: renderCentroidFragWgsl },
            primitive: { topology: 'triangle-list' },
        },
        // 显示管线
        {
            vertex: { glsl: splashVertGlsl, wgsl: splashVertWgsl },
            fragment: { glsl: splashFragGlsl, wgsl: splashFragWgsl, targets: [{ blend: {} }] },
            primitive: { topology: 'triangle-list' },
        },
    ];

    // 三角形顶点数据（缩小的三角形，用于展示边缘插值问题）
    const scaleFactor = 0.1;
    const positions = new Float32Array([
        scaleFactor * 0.0, scaleFactor * 0.8,
        scaleFactor * -0.8, scaleFactor * -0.4,
        scaleFactor * 1.0, scaleFactor * -0.8,
    ]);

    // 顶点数据值（用于插值的数据）
    // 第一个顶点: 0.0, 第二个顶点: 0.0, 第三个顶点: 1.0
    const data = new Float32Array([0.0, 0.0, 1.0]);

    // 用于显示纹理的全屏四边形
    const textureVertexPositions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    const textureVertexTexCoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
    ]);

    // 顶点数组
    const vertexArrays: { vertices?: VertexAttributes }[] = [
        // 普通三角形
        {
            vertices: {
                position: { data: positions, format: 'float32x2' },
                data: { data, format: 'float32' },
            },
        },
        // centroid 三角形（相同数据）
        {
            vertices: {
                position: { data: positions, format: 'float32x2' },
                data: { data, format: 'float32' },
            },
        },
        // 全屏四边形（显示用）
        {
            vertices: {
                position: { data: textureVertexPositions, format: 'float32x2' },
                texcoord: { data: textureVertexTexCoords, format: 'float32x2' },
            },
        },
    ];

    // 帧缓冲区尺寸
    const FRAMEBUFFER_SIZE = {
        x: canvasSize.x,
        y: canvasSize.y,
    };

    // 创建用于离屏渲染的纹理
    const textures: Texture[] = [];
    const samplers: Sampler[] = [];

    for (let i = 0; i < VIEWPORTS.MAX; ++i)
    {
        textures[i] = {
            descriptor: {
                format: 'rgba8unorm',
                size: [FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y],
            },
        };
        samplers[i] = { minFilter: 'nearest', magFilter: 'nearest' };
    }

    // 帧缓冲区描述（使用 4x 多重采样）
    const framebuffers: RenderPassDescriptor[] = [
        {
            colorAttachments: [{
                view: { texture: textures[0], baseMipLevel: 0 },
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
            sampleCount: 4,  // 4x MSAA
        },
        {
            colorAttachments: [{
                view: { texture: textures[1], baseMipLevel: 0 },
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
            sampleCount: 4,  // 4x MSAA
        },
    ];

    // Pass 1: 渲染三角形到多重采样帧缓冲区
    const passEncoders: PassEncoder[] = [];
    const IDENTITY = mat4.create();

    for (let i = 0; i < VIEWPORTS.MAX; ++i)
    {
        const rp: RenderPass = {
            descriptor: framebuffers[i],
            renderPassObjects: [{
                pipeline: programs[i],  // i=0: 普通, i=1: centroid
                bindingResources: { MVP: { value: IDENTITY as Float32Array } },
                vertices: vertexArrays[i].vertices,
                draw: { __type__: 'DrawVertex', vertexCount: 3 },
            }],
        };
        passEncoders.push(rp);
    }

    // Pass 2: 将结果显示到屏幕
    const renderObjects: RenderPassObject[] = [];
    const ro: RenderObject = {
        pipeline: programs[PROGRAM.SPLASH],
        vertices: vertexArrays[PROGRAM.SPLASH].vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

    // 计算缩放矩阵（将三角形放大到合适尺寸）
    const scaleVector3 = vec3.create();
    const invScaleFactor = 0.8 / scaleFactor;
    vec3.set(scaleVector3, invScaleFactor, invScaleFactor, invScaleFactor);
    const mvp = mat4.create();
    mat4.scale(mvp, IDENTITY, scaleVector3);

    for (let i = 0; i < VIEWPORTS.MAX; ++i)
    {
        renderObjects.push({
            ...ro,
            viewport: viewport[i],
            bindingResources: {
                MVP: { value: mvp as Float32Array },
                diffuse: { texture: textures[i], sampler: samplers[i] },
            },
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        });
    }

    const rp2: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
        },
        renderPassObjects: renderObjects,
    };
    passEncoders.push(rp2);

    // 提交渲染
    const submit = { commandEncoders: [{ passEncoders }] };
    webgl.submit(submit);
    webgpu.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
