import { OcclusionQuery, RenderObject, RenderPass, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
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

    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 渲染管线 - 使用生成的着色器代码
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
        depthStencil: {},
        primitive: { topology: 'triangle-list' },
    };

    // 顶点数据 - 两个三角形
    // 第一个三角形在前面 (z=0.0)
    // 第二个三角形在后面 (z=0.5)
    const vertices = new Float32Array([
        // 第一个三角形 (前面)
        -0.3, -0.5, 0.0,
        0.3, -0.5, 0.0,
        0.0, 0.5, 0.0,
        // 第二个三角形 (后面)
        -0.3, -0.5, 0.5,
        0.3, -0.5, 0.5,
        0.0, 0.5, 0.5,
    ]);

    // 顶点属性
    const vertexArray: { vertices?: VertexAttributes } = {
        vertices: {
            pos: { data: vertices, format: 'float32x3' },
        },
    };

    // 第一个三角形渲染对象（前面）
    const renderObject1: RenderObject = {
        pipeline: program,
        vertices: vertexArray.vertices,
        draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 3 },
    };

    // 第二个三角形渲染对象（后面，用于遮挡查询）
    const renderObject2: RenderObject = {
        pipeline: program,
        vertices: vertexArray.vertices,
        draw: { __type__: 'DrawVertex', firstVertex: 3, vertexCount: 3 },
    };

    // 创建 WebGL 遮挡查询
    const webglOcclusionQuery: OcclusionQuery = {
        __type__: 'OcclusionQuery',
        renderObjects: [renderObject2],
        onQuery(result: number)
        {
            const resultElement = document.getElementById('webgl-query-result');
            if (resultElement)
            {
                resultElement.innerHTML = `WebGL: 通过深度测试的样本数: ${result}`;
            }
        },
    };

    // 创建 WebGPU 遮挡查询
    const webgpuOcclusionQuery: OcclusionQuery = {
        __type__: 'OcclusionQuery',
        renderObjects: [renderObject2],
        onQuery(result: number)
        {
            const resultElement = document.getElementById('webgpu-query-result');
            if (resultElement)
            {
                resultElement.innerHTML = `WebGPU: 通过深度测试的样本数: ${result}`;
            }
        },
    };

    // WebGL 渲染通道
    const webglRenderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
            depthStencilAttachment: { depthLoadOp: 'clear' },
        },
        renderPassObjects: [renderObject1, webglOcclusionQuery],
    };

    // WebGPU 渲染通道
    const webgpuRenderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
            depthStencilAttachment: { depthLoadOp: 'clear' },
        },
        renderPassObjects: [renderObject1, webgpuOcclusionQuery],
    };

    // WebGL 渲染提交
    const webglSubmit: Submit = {
        commandEncoders: [{
            passEncoders: [webglRenderPass],
        }],
    };

    // WebGPU 渲染提交
    const webgpuSubmit: Submit = {
        commandEncoders: [{
            passEncoders: [webgpuRenderPass],
        }],
    };

    // 执行渲染
    webgl.submit(webglSubmit);
    webgpu.submit(webgpuSubmit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});
