import { CopyBufferToBuffer, RenderPassDescriptor, Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import { fragmentShader, vertexShader } from './shaders/shader';

// 注释掉TSL着色器导入
// import { fragmentShader, vertexShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用函数式方式定义着色器生成着色器代码
    const vertexGlsl = vertexShader.toGLSL();
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentGlsl = fragmentShader.toGLSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 顶点数据
    const vertices = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    // 目标缓冲区（初始为空）
    const vertexPosBufferDst = new Float32Array(vertices.length);

    // 缓冲区复制命令
    const copyBufferCommand: CopyBufferToBuffer = {
        __type__: 'CopyBufferToBuffer',
        source: vertices,
        destination: vertexPosBufferDst,
    };

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    // 首先执行缓冲区复制
                    copyBufferCommand,
                    // 然后执行渲染通道
                    {
                        descriptor: {
                            colorAttachments: [{
                                clearValue: [0.0, 0.0, 0.0, 1.0],
                                loadOp: 'clear',
                            }],
                        },
                        renderPassObjects: [{
                            pipeline: {
                                vertex: {
                                    glsl: vertexGlsl,
                                    wgsl: vertexWgsl,
                                },
                                fragment: {
                                    glsl: fragmentGlsl,
                                    wgsl: fragmentWgsl,
                                },
                                primitive: { topology: 'triangle-list' },
                            },
                            vertices: {
                                pos: { data: vertexPosBufferDst, format: 'float32x2' },
                            },
                            draw: { __type__: 'DrawVertex', vertexCount: 6 },
                        }],
                    },
                ],
            },
        ],
    };

    // 执行渲染
    webgpu.submit(submit);
    webgl.submit(submit);

    // 第一帧后进行比较
    autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
});