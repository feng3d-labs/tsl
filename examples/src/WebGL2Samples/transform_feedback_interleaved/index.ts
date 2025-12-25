import { Buffer, RenderPipeline, Submit, TransformFeedback, TransformFeedbackPipeline, VertexAttributes, VertexData } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉 TSL 生成的代码，使用这些原始着色器）
import fragmentFeedbackGlsl from './shaders/fragment-feedback.glsl';
import fragmentFeedbackWgsl from './shaders/fragment-feedback.wgsl';
import vertexFeedbackGlsl from './shaders/vertex-feedback.glsl';
import vertexFeedbackWgsl from './shaders/vertex-feedback.wgsl';
import vertexTransformGlsl from './shaders/vertex-transform.glsl';
// 导入 TSL 着色器
import { feedbackFragmentShader, feedbackVertexShader, transformVertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码（变量名必须与导入的相同，便于调试切换）
    const vertexTransformGlsl = transformVertexShader.toGLSL(2);
    // 生成 WGSL 计算着色器（用于 WebGPU Transform Feedback 模拟）
    const computeTransformWgsl = transformVertexShader.toComputeWGSL({
        outputs: ['gl_Position', 'v_color'],
        workgroupSize: 64,
    });
    const vertexFeedbackGlsl = feedbackVertexShader.toGLSL(2);
    const fragmentFeedbackGlsl = feedbackFragmentShader.toGLSL(2);
    const vertexFeedbackWgsl = feedbackVertexShader.toWGSL();
    const fragmentFeedbackWgsl = feedbackFragmentShader.toWGSL(feedbackVertexShader);

    // 缓冲区配置
    const SIZE_V4C4 = 32; // vec4 (position) + vec4 (color) = 32 bytes
    const VERTEX_COUNT = 6;
    const PROGRAM_TRANSFORM = 0;
    const PROGRAM_FEEDBACK = 1;

    // 顶点数据 - 形成两个三角形（覆盖整个画布）
    const vertices = new Float32Array([
        -1.0, -1.0, 0.0, 1.0,
        1.0, -1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        -1.0, 1.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 1.0,
    ]);

    // 缓冲区：索引 0 为 Transform 输入，索引 1 为 Feedback 输出/渲染输入
    const buffers: VertexData[] = [
        vertices,
        new Float32Array(SIZE_V4C4 * VERTEX_COUNT / Float32Array.BYTES_PER_ELEMENT),
    ];

    // 顶点属性配置
    const vertexArrays: { vertices?: VertexAttributes }[] = [
        {
            vertices: {
                position: { data: buffers[PROGRAM_TRANSFORM], format: 'float32x4' },
            },
        },
        {
            vertices: {
                position: { data: buffers[PROGRAM_FEEDBACK], format: 'float32x4', arrayStride: SIZE_V4C4, offset: 0 },
                color: { data: buffers[PROGRAM_FEEDBACK], format: 'float32x4', arrayStride: SIZE_V4C4, offset: SIZE_V4C4 / 2 },
            },
        },
    ];

    // Transform Feedback 管线（仅 WebGL 支持）
    const programTransform: TransformFeedbackPipeline = {
        vertex: { glsl: vertexTransformGlsl, wgsl: computeTransformWgsl },
        transformFeedbackVaryings: { varyings: ['gl_Position', 'v_color'], bufferMode: 'INTERLEAVED_ATTRIBS' },
    };

    // Feedback 渲染管线（同时支持 WebGL 和 WebGPU）
    const programFeedback: RenderPipeline = {
        vertex: { glsl: vertexFeedbackGlsl, wgsl: vertexFeedbackWgsl },
        fragment: { glsl: fragmentFeedbackGlsl, wgsl: fragmentFeedbackWgsl },
    };

    // Transform Feedback 配置
    const transformFeedback: TransformFeedback = {
        bindBuffers: [
            { index: 0, data: buffers[PROGRAM_FEEDBACK] },
        ],
    };

    // MVP 矩阵（缩放 0.5）
    const matrix = new Float32Array([
        0.5, 0.0, 0.0, 0.0,
        0.0, 0.5, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 渲染提交（WebGL 和 WebGPU 共用）
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                // 第一阶段：Transform Feedback Pass
                // WebGL: 使用 Transform Feedback
                // WebGPU: 自动转换为 Compute Pass
                {
                    __type__: 'TransformFeedbackPass',
                    transformFeedbackObjects: [
                        {
                            pipeline: programTransform,
                            vertices: vertexArrays[PROGRAM_TRANSFORM].vertices,
                            uniforms: { MVP: { value: matrix } },
                            transformFeedback,
                            draw: { __type__: 'DrawVertex', vertexCount: VERTEX_COUNT },
                        },
                    ],
                },
                // 第二阶段：使用捕获的属性进行渲染
                {
                    descriptor: { colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }] },
                    renderPassObjects: [
                        {
                            pipeline: programFeedback,
                            vertices: vertexArrays[PROGRAM_FEEDBACK].vertices,
                            draw: { __type__: 'DrawVertex', vertexCount: VERTEX_COUNT },
                        },
                    ],
                },
            ],
        }],
    };

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2', webGLContextAttributes: { antialias: false } });

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 执行渲染
    webgl.submit(submit);
    webgpu.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);

    // 清理 WebGL 资源
    webgl.deleteTransformFeedback(transformFeedback);
    webgl.deleteBuffer(Buffer.getBuffer(buffers[PROGRAM_TRANSFORM].buffer));
    webgl.deleteBuffer(Buffer.getBuffer(buffers[PROGRAM_FEEDBACK].buffer));
    webgl.deleteProgram(programTransform);
    webgl.deleteProgram(programFeedback);
});
