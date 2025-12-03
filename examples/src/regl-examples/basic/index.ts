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
    webgpuCanvas.width = window.innerWidth * devicePixelRatio;
    webgpuCanvas.height = window.innerHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = window.innerWidth * devicePixelRatio;
    webglCanvas.height = window.innerHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    const renderObject = {
        vertices: {
            position: {
                data: new Float32Array([
                    -1, 0,
                    0, -1,
                    1, 1,
                ]),
                format: 'float32x2' as const,
            },
        },
        draw: { __type__: 'DrawVertex' as const, vertexCount: 3 },
        bindingResources: { color: { value: [1, 0, 0, 1] } },
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
    };

    function draw()
    {
        webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
        webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
        webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
        webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [
                    {
                        descriptor: {
                            colorAttachments: [{ clearValue: [0, 0, 0, 1] }],
                            depthStencilAttachment: { depthClearValue: 1 },
                        },
                        renderPassObjects: [renderObject],
                    },
                ],
            }],
        };

        webgpu.submit(submit);
        webgl.submit(submit);

        requestAnimationFrame(draw);
    }
    draw();
});

