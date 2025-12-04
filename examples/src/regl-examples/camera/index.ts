import { RenderObject, Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { angleNormals } from './utils/angle-normals';
import * as bunny from './utils/bunny';
import { createCamera } from './utils/camera';

import { vertexShader, fragmentShader } from './shaders/shader';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL();
    const fragmentGlsl = fragmentShader.toGLSL();
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

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
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2', webGLContextAttributes: { antialias: true } });

    const camera = createCamera({
        center: [0, 2.5, 0],
    });

    const positions = bunny.positions.flat();
    const indices = bunny.cells.flat();
    const normals = angleNormals(bunny.cells, bunny.positions).flat();

    const renderObject: RenderObject = {
        vertices: {
            position: { data: new Float32Array(positions), format: 'float32x3' as const },
            normal: { data: new Float32Array(normals), format: 'float32x3' as const },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed' as const, indexCount: indices.length },
        bindingResources: {},
        pipeline: {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentGlsl,
                wgsl: fragmentWgsl,
            },
            depthStencil: { depthWriteEnabled: true },
        },
    };

    let frameCount = 0;

    function draw()
    {
        webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
        webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
        webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
        webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;

        camera(renderObject, webglCanvas.width, webglCanvas.height);

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

        // 第一帧后进行比较
        if (frameCount === 0)
        {
            frameCount++;
            autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
        }

        requestAnimationFrame(draw);
    }
    draw();
});

