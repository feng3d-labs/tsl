import { reactive } from '@feng3d/reactivity';
import { RenderObject, Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';

import { vertexShader, fragmentShader } from './shaders/shader';

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
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    let tick = 0;
    const offsets = [
        { offset: [-1, -1] },
        { offset: [-1, 0] },
        { offset: [-1, 1] },
        { offset: [0, -1] },
        { offset: [0, 0] },
        { offset: [0, 1] },
        { offset: [1, -1] },
        { offset: [1, 0] },
        { offset: [1, 1] },
    ];

    const vertexArray = {
        vertices: {
            position: {
                data: new Float32Array([
                    0.5, 0,
                    0, 0.5,
                    1, 1,
                ]),
                format: 'float32x2' as const,
            },
        },
    };

    function getRenderObject(batchId: number): RenderObject
    {
        const renderObject: RenderObject = {
            vertices: vertexArray.vertices,
            draw: { __type__: 'DrawVertex' as const, vertexCount: 3 },
            bindingResources: {
                offset: { value: offsets[batchId].offset },
            },
            pipeline: {
                vertex: {
                    glsl: vertexGlsl,
                    wgsl: vertexWgsl,
                },
                fragment: {
                    glsl: fragmentGlsl,
                    wgsl: fragmentWgsl,
                },
                depthStencil: { depthWriteEnabled: false },
            },
        };

        return renderObject;
    }

    const renderObjects: RenderObject[] = [];
    for (let i = 0; i < offsets.length; i++)
    {
        renderObjects.push(getRenderObject(i));
    }

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: { colorAttachments: [{ clearValue: [0, 0, 0, 1] }] },
                    renderPassObjects: renderObjects,
                },
            ],
        }],
    };

    function draw()
    {
        webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
        webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
        webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
        webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;

        tick++;

        for (let i = 0; i < offsets.length; i++)
        {
            const batchId = i;
            const ro = renderObjects[i];
            reactive(ro.bindingResources).color = { value: [
                Math.sin(0.02 * ((0.1 + Math.sin(batchId)) * tick + 3.0 * batchId)),
                Math.cos(0.02 * (0.02 * tick + 0.1 * batchId)),
                Math.sin(0.02 * ((0.3 + Math.cos(2.0 * batchId)) * tick + 0.8 * batchId)),
                1] };
            reactive(ro.bindingResources).angle = { value: 0.01 * tick };
        }

        webgpu.submit(submit);
        webgl.submit(submit);

        requestAnimationFrame(draw);
    }
    draw();
});

