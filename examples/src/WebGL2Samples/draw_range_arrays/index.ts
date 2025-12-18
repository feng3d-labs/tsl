import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入TSL着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 顶点数据 - 12个顶点，分为两组
    // 第一组（0-5）：外框
    // 第二组（6-11）：内框
    const vertexPosBuffer = new Float32Array([
        -0.8, -0.8,
        0.8, -0.8,
        0.8, 0.8,
        0.8, 0.8,
        -0.8, 0.8,
        -0.8, -0.8,
        -0.5, -0.5,
        0.5, -0.5,
        0.5, 0.5,
        0.5, 0.5,
        -0.5, 0.5,
        -0.5, -0.5,
    ]);

    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 渲染管线 - 使用生成的着色器代码
    const pipeline: RenderPipeline = {
        vertex: {
            glsl: vertexGlsl,
            wgsl: vertexWgsl,
        },
        fragment: {
            glsl: fragmentGlsl,
            wgsl: fragmentWgsl,
            targets: [{ blend: {} }],
        },
        primitive: { topology: 'triangle-strip' },
    };

    // 顶点属性
    const vertexArray: { vertices?: VertexAttributes } = {
        vertices: {
            position: { data: vertexPosBuffer, format: 'float32x2' },
        },
    };

    const vertexCount = 12;

    // 基础渲染对象
    const baseRenderObject: RenderObject = {
        bindingResources: {},
        vertices: vertexArray.vertices,
        pipeline,
        draw: { __type__: 'DrawVertex', vertexCount: 0 },
    };

    // 渲染提交 - 使用两个视口分别绘制不同范围的顶点
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: {
                        colorAttachments: [{
                            clearValue: [0.0, 0.0, 0.0, 1.0],
                            loadOp: 'clear',
                        }],
                    },
                    renderPassObjects: [
                        // 左半边：绘制第一组顶点（0-5）外框
                        {
                            ...baseRenderObject,
                            viewport: { x: 0, y: 0, width: webglCanvas.width / 2, height: webglCanvas.height },
                            draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: vertexCount / 2 },
                        },
                        // 右半边：绘制第二组顶点（6-11）内框
                        {
                            ...baseRenderObject,
                            viewport: { x: webglCanvas.width / 2, y: 0, width: webglCanvas.width / 2, height: webglCanvas.height },
                            draw: { __type__: 'DrawVertex', firstVertex: 6, vertexCount: vertexCount / 2 },
                        },
                    ],
                },
            ],
        }],
    };

    // 执行渲染
    webgl.submit(submit);

    // WebGPU 需要使用自己的画布尺寸
    const submitWebGPU: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: {
                        colorAttachments: [{
                            clearValue: [0.0, 0.0, 0.0, 1.0],
                            loadOp: 'clear',
                        }],
                    },
                    renderPassObjects: [
                        // 左半边：绘制第一组顶点（0-5）外框
                        {
                            ...baseRenderObject,
                            viewport: { x: 0, y: 0, width: webgpuCanvas.width / 2, height: webgpuCanvas.height },
                            draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: vertexCount / 2 },
                        },
                        // 右半边：绘制第二组顶点（6-11）内框
                        {
                            ...baseRenderObject,
                            viewport: { x: webgpuCanvas.width / 2, y: 0, width: webgpuCanvas.width / 2, height: webgpuCanvas.height },
                            draw: { __type__: 'DrawVertex', firstVertex: 6, vertexCount: vertexCount / 2 },
                        },
                    ],
                },
            ],
        }],
    };

    webgpu.submit(submitWebGPU);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
