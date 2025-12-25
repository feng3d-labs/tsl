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
import computeTransformWgsl from './shaders/vertex-transform.wgsl';
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
    const vertexTransformGlsl = transformVertexShader.toGLSL();
    // 生成 WGSL 计算着色器（用于 WebGPU Transform Feedback 模拟）
    // 分离模式：gl_Position 和 v_color 输出到不同的缓冲区
    const computeTransformWgsl = transformVertexShader.toWGSL({
        varyings: ['gl_Position', 'v_color'],
        bufferMode: 'SEPARATE_ATTRIBS',
    });
    const vertexFeedbackGlsl = feedbackVertexShader.toGLSL(2);
    const fragmentFeedbackGlsl = feedbackFragmentShader.toGLSL(2);
    const vertexFeedbackWgsl = feedbackVertexShader.toWGSL();
    const fragmentFeedbackWgsl = feedbackFragmentShader.toWGSL(feedbackVertexShader);

    // 缓冲区配置
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

    // 缓冲区类型
    const BufferType = {
        VERTEX: 0,      // Transform 输入
        POSITION: 1,    // Feedback 输出 - 位置（分离缓冲区）
        COLOR: 2,       // Feedback 输出 - 颜色（分离缓冲区）
        MAX: 3,
    };

    // 缓冲区：分离模式 - position 和 color 存储在不同的缓冲区
    const buffers: VertexData[] = [
        vertices,                   // Transform 输入
        vertices.slice(),           // Position 输出缓冲区
        vertices.slice(),           // Color 输出缓冲区
    ];

    // 顶点属性配置
    const vertexArrays: { vertices?: VertexAttributes }[] = [
        {
            // Transform 输入：仅 position
            vertices: {
                position: { data: buffers[BufferType.VERTEX], format: 'float32x4' },
            },
        },
        {
            // Feedback 输入：position 和 color 来自不同的缓冲区（分离模式）
            vertices: {
                position: { data: buffers[BufferType.POSITION], format: 'float32x4' },
                color: { data: buffers[BufferType.COLOR], format: 'float32x4' },
            },
        },
    ];

    // Transform Feedback 管线
    const programTransform: TransformFeedbackPipeline = {
        vertex: { glsl: vertexTransformGlsl, wgsl: computeTransformWgsl },
        // 分离模式：gl_Position 和 v_color 输出到不同的缓冲区
        transformFeedbackVaryings: { varyings: ['gl_Position', 'v_color'], bufferMode: 'SEPARATE_ATTRIBS' },
    };

    // Feedback 渲染管线
    const programFeedback: RenderPipeline = {
        vertex: { glsl: vertexFeedbackGlsl, wgsl: vertexFeedbackWgsl },
        fragment: { glsl: fragmentFeedbackGlsl, wgsl: fragmentFeedbackWgsl },
    };

    // Transform Feedback 配置（分离模式：每个输出绑定到不同的缓冲区）
    const transformFeedback: TransformFeedback = {
        bindBuffers: [
            { index: 0, data: buffers[BufferType.POSITION] },   // gl_Position -> 缓冲区 0
            { index: 1, data: buffers[BufferType.COLOR] },      // v_color -> 缓冲区 1
        ],
    };

    // MVP 矩阵（缩放 0.5）
    const matrix = new Float32Array([
        0.5, 0.0, 0.0, 0.0,
        0.0, 0.5, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                // 第一阶段：Transform Feedback Pass
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
    webgl.deleteBuffer(Buffer.getBuffer(buffers[BufferType.VERTEX].buffer));
    webgl.deleteBuffer(Buffer.getBuffer(buffers[BufferType.POSITION].buffer));
    webgl.deleteBuffer(Buffer.getBuffer(buffers[BufferType.COLOR].buffer));
    webgl.deleteProgram(programTransform);
    webgl.deleteProgram(programFeedback);
});

