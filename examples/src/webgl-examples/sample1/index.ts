import { Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';

import { vertexShader, fragmentShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL();
    const fragmentGlsl = fragmentShader.toGLSL();
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 创建提交对象
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
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
                            },
                            vertices: {
                                position: {
                                    data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]),
                                    format: 'float32x2',
                                },
                            },
                            indices: new Uint16Array([0, 1, 2]),
                            draw: { __type__: 'DrawIndexed', indexCount: 3 },
                            bindingResources: { color: { value: [1, 0, 0, 1] } },
                        }],
                    },
                ],
            },
        ],
    };

    // 提交渲染命令
    webgpu.submit(submit);
    webgl.submit(submit);
});

