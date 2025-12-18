import { RenderPass, RenderPassDescriptor, RenderPipeline, Sampler, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import renderFragmentGlsl from './shaders/fragment.glsl';
import renderFragmentWgsl from './shaders/fragment.wgsl';
import renderVertexGlsl from './shaders/vertex.glsl';
import renderVertexWgsl from './shaders/vertex.wgsl';
import splashFragmentGlsl from './shaders/splash_fragment.glsl';
import splashFragmentWgsl from './shaders/splash_fragment.wgsl';
import splashVertexGlsl from './shaders/splash_vertex.glsl';
import splashVertexWgsl from './shaders/splash_vertex.wgsl';
// 导入TSL着色器
import { renderFragmentShader, renderVertexShader, splashFragmentShader, splashVertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 生成着色器代码 - Render Shader
    const renderVertexGlsl = renderVertexShader.toGLSL(2);
    const renderFragmentGlsl = renderFragmentShader.toGLSL(2);
    const renderVertexWgsl = renderVertexShader.toWGSL();
    const renderFragmentWgsl = renderFragmentShader.toWGSL(renderVertexShader);

    // 生成着色器代码 - Splash Shader
    const splashVertexGlsl = splashVertexShader.toGLSL(2);
    const splashFragmentGlsl = splashFragmentShader.toGLSL(2);
    const splashVertexWgsl = splashVertexShader.toWGSL();
    const splashFragmentWgsl = splashFragmentShader.toWGSL(splashVertexShader);

    // 渲染管线 - Render（渲染到多重采样纹理）
    const renderPipeline: RenderPipeline = {
        vertex: {
            glsl: renderVertexGlsl,
            wgsl: renderVertexWgsl,
        },
        fragment: {
            glsl: renderFragmentGlsl,
            wgsl: renderFragmentWgsl,
        },
        primitive: { topology: 'triangle-list' },
    };

    // 渲染管线 - Splash（将纹理渲染到屏幕）
    const splashPipeline: RenderPipeline = {
        vertex: {
            glsl: splashVertexGlsl,
            wgsl: splashVertexWgsl,
        },
        fragment: {
            glsl: splashFragmentGlsl,
            wgsl: splashFragmentWgsl,
            targets: [{ blend: {} }],
        },
        primitive: { topology: 'triangle-list' },
    };

    // 生成圆形顶点数据（LINE_LOOP）
    const vertexCount = 18;
    const circleData = new Float32Array(vertexCount * 2);
    const radius = 0.1;
    for (let i = 0; i < vertexCount; i++)
    {
        const angle = Math.PI * 2 * i / vertexCount;
        circleData[2 * i] = radius * Math.sin(angle);
        circleData[2 * i + 1] = radius * Math.cos(angle);
    }

    // Splash 顶点数据
    const positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    const texCoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
    ]);

    // 顶点属性
    const renderVertices: VertexAttributes = {
        position: { data: circleData, format: 'float32x2' },
    };

    const splashVertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        texcoord: { data: texCoords, format: 'float32x2' },
    };

    // MVP 矩阵
    const IDENTITY = mat4.create();

    const scaleVector3 = vec3.create();
    vec3.set(scaleVector3, 8.0, 8.0, 8.0);
    const mvp = mat4.create();
    mat4.scale(mvp, IDENTITY, scaleVector3);

    // 纹理尺寸（WebGL 和 WebGPU 画布尺寸相同）
    const FRAMEBUFFER_SIZE = {
        x: webglCanvas.width,
        y: webglCanvas.height,
    };

    // 创建目标纹理
    const targetTexture: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            size: [FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y],
        },
    };
    const sampler: Sampler = { minFilter: 'nearest', magFilter: 'nearest' };

    // 多重采样帧缓冲
    const framebuffer: RenderPassDescriptor = {
        colorAttachments: [{
            view: { texture: targetTexture, baseMipLevel: 0 },
            clearValue: [0.0, 0.0, 0.0, 1.0],
        }],
        sampleCount: 4, // 4x 多重采样
    };

    // Pass 1：渲染圆形到多重采样纹理
    const renderPass1: RenderPass = {
        descriptor: framebuffer,
        renderPassObjects: [{
            pipeline: {
                ...renderPipeline,
                primitive: { topology: 'line-strip' },
            },
            bindingResources: {
                MVP: { value: IDENTITY as Float32Array },
            },
            vertices: renderVertices,
            draw: { __type__: 'DrawVertex', vertexCount },
        }],
    };

    // Pass 2：将纹理渲染到屏幕
    const renderPass2: RenderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
        },
        renderPassObjects: [{
            pipeline: splashPipeline,
            bindingResources: {
                diffuse: { texture: targetTexture, sampler },
                MVP: { value: mvp as Float32Array },
            },
            vertices: splashVertices,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        }],
    };

    // 提交渲染命令（WebGL 和 WebGPU 共用同一套数据）
    const submit = {
        commandEncoders: [{
            passEncoders: [renderPass1, renderPass2],
        }],
    };

    webgl.submit(submit);
    webgpu.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
