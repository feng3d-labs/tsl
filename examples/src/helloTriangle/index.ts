import { RenderPassDescriptor, Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';

import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import { fragmentShader, vertexShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用函数式方式定义着色器生成着色器代码
    // shaderType 作为第一个参数，必须提供；entry 作为第二个参数，可选（对应 vertex("main", ...) 和 fragment("main", ...) 中的函数名）
    const vertexGlsl = vertexShader.toGLSL();
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentGlsl = fragmentShader.toGLSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    //
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init(); // 初始化WebGPU

    //
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' }); // 初始化WebGL

    //
    const submit: Submit = { // 一次GPU提交
        commandEncoders: [ // 命令编码列表
            {
                passEncoders: [ // 通道编码列表
                    { // 渲染通道
                        descriptor: {
                            colorAttachments: [{
                                clearValue: [0.0, 0.0, 0.0, 1.0],
                                loadOp: 'clear',
                            }],
                        },
                        renderPassObjects: [{ // 渲染对象
                            pipeline: { // 渲染管线
                                vertex: { // 顶点着色器
                                    glsl: vertexGlsl,
                                    wgsl: vertexWgsl,
                                },
                                fragment: { // 片段着色器
                                    glsl: fragmentGlsl,
                                    wgsl: fragmentWgsl,
                                },
                            },
                            vertices: {
                                position: { data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]), format: 'float32x2' }, // 顶点坐标数据
                            },
                            indices: new Uint16Array([0, 1, 2]), // 顶点索引数据
                            draw: { __type__: 'DrawIndexed', indexCount: 3 }, // 绘制命令
                            bindingResources: { color: { value: [1, 0, 0, 1] } }, // Uniform 颜色值。
                        }],
                    },
                ],
            },
        ],
    };

    webgpu.submit(submit);
    webgl.submit(submit);
});
