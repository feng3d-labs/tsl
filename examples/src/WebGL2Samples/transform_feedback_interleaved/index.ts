import { Buffer, RenderPipeline, VertexAttributes, VertexData } from '@feng3d/render-api';
import { TransformFeedback, TransformFeedbackPipeline, WebGL } from '@feng3d/webgl';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import fragmentTransformGlsl from './shaders/fragment-transform.glsl';
import fragmentFeedbackGlsl from './shaders/fragment-feedback.glsl';
import vertexTransformGlsl from './shaders/vertex-transform.glsl';
import vertexFeedbackGlsl from './shaders/vertex-feedback.glsl';
// 导入TSL着色器
import { feedbackFragmentShader, feedbackVertexShader, transformFragmentShader, transformVertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGL（Transform Feedback 是 WebGL 特有功能）
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2', webGLContextAttributes: { antialias: false } });

    // 生成着色器代码
    const vertexTransformGlsl = transformVertexShader.toGLSL(2);
    const fragmentTransformGlsl = transformFragmentShader.toGLSL(2);
    const vertexFeedbackGlsl = feedbackVertexShader.toGLSL(2);
    const fragmentFeedbackGlsl = feedbackFragmentShader.toGLSL(2);

    // Transform Feedback 管线
    const programTransform: TransformFeedbackPipeline = {
        vertex: { code: vertexTransformGlsl },
        transformFeedbackVaryings: {
            varyings: ['gl_Position', 'v_color'],
            bufferMode: 'INTERLEAVED_ATTRIBS',
        },
    };

    // Feedback 渲染管线
    const programFeedback: RenderPipeline = {
        vertex: { code: vertexFeedbackGlsl },
        fragment: { code: fragmentFeedbackGlsl },
    };

    // 缓冲区配置
    const SIZE_V4C4 = 32; // vec4 (position) + vec4 (color) = 32 bytes
    const VERTEX_COUNT = 6;

    // 顶点数据 - 形成两个三角形（覆盖整个画布）
    const vertices = new Float32Array([
        -1.0, -1.0, 0.0, 1.0,
        1.0, -1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        -1.0, 1.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 1.0,
    ]);

    // 缓冲区：索引0为Transform输入，索引1为Feedback输出/渲染输入
    const PROGRAM_TRANSFORM = 0;
    const PROGRAM_FEEDBACK = 1;

    const buffers: VertexData[] = [
        // Transform 缓冲区（输入）
        vertices,
        // Feedback 空缓冲区（输出，用于接收Transform Feedback的结果）
        new Float32Array(SIZE_V4C4 * VERTEX_COUNT / Float32Array.BYTES_PER_ELEMENT),
    ];

    // 顶点属性配置
    const vertexArrays: { vertices?: VertexAttributes }[] = [
        // Transform 阶段的顶点属性
        {
            vertices: {
                position: { data: buffers[PROGRAM_TRANSFORM], format: 'float32x4' },
            },
        },
        // Feedback 阶段的顶点属性（从 Transform Feedback 输出缓冲区读取）
        {
            vertices: {
                position: {
                    data: buffers[PROGRAM_FEEDBACK],
                    format: 'float32x4',
                    arrayStride: SIZE_V4C4,
                    offset: 0,
                },
                color: {
                    data: buffers[PROGRAM_FEEDBACK],
                    format: 'float32x4',
                    arrayStride: SIZE_V4C4,
                    offset: SIZE_V4C4 / 2, // 16 bytes 偏移，跳过 position
                },
            },
        },
    ];

    // Transform Feedback 配置
    const transformFeedback: TransformFeedback = {
        bindBuffers: [
            { index: 0, data: buffers[PROGRAM_FEEDBACK] },
        ],
    };

    // MVP 矩阵（缩放0.5）
    const matrix = new Float32Array([
        0.5, 0.0, 0.0, 0.0,
        0.0, 0.5, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 提交渲染命令
    webgl.submit({
        commandEncoders: [{
            passEncoders: [
                // 第一阶段：Transform Feedback Pass（禁用光栅化）
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
                    descriptor: {
                        colorAttachments: [{
                            clearValue: [0.0, 0.0, 0.0, 1.0],
                            loadOp: 'clear',
                        }],
                    },
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
    });

    // 清理 WebGL 资源
    webgl.deleteTransformFeedback(transformFeedback);
    webgl.deleteBuffer(Buffer.getBuffer(buffers[PROGRAM_TRANSFORM].buffer));
    webgl.deleteBuffer(Buffer.getBuffer(buffers[PROGRAM_FEEDBACK].buffer));
    webgl.deleteProgram(programTransform);
    webgl.deleteProgram(programFeedback);
});

