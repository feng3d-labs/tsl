import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';

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

    // 顶点数据
    const vertexPosBuffer = new Float32Array([-0.3, -0.5,
        0.3, -0.5,
        0.0, 0.5]);
    const vertexColorBuffer = new Float32Array([
        1.0, 0.5, 0.0,
        0.0, 0.5, 1.0]);

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            glsl: vertexGlsl,
            wgsl: vertexWgsl,
        },
        fragment: {
            glsl: fragmentGlsl,
            wgsl: fragmentWgsl,
            targets: [{ blend: {} }],
        },
        primitive: { topology: 'triangle-list' },
    };

    // 顶点属性
    const vertexArray: { vertices?: VertexAttributes } = {
        vertices: {
            pos: { data: vertexPosBuffer, format: 'float32x2' },
            color: { data: vertexColorBuffer, format: 'float32x3', stepMode: 'instance' },
        },
    };

    // 渲染对象
    const renderObject: RenderObject = {
        bindingResources: {},
        vertices: vertexArray.vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 3, instanceCount: 2 },
        pipeline: program,
    };

    // 渲染提交
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
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

    // 执行渲染
    // webgpu.submit(submit);
    webgl.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
