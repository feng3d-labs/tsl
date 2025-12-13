import { reactive } from '@feng3d/reactivity';
import { RenderObject, Submit } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import * as bunny from './utils/bunny';
import * as mat4 from './utils/gl-mat4';

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
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2', webGLContextAttributes: { antialias: true } });

    const positions = bunny.positions.reduce((pv: number[], cv: number[]) =>
    {
        cv.forEach((v) => { pv.push(v); });

        return pv;
    }, []);

    const indices = bunny.cells.reduce((pv: number[], cv: number[]) =>
    {
        cv.forEach((v) => { pv.push(v); });

        return pv;
    }, []);

    let tick = 0;
    let viewportWidth = webglCanvas.clientWidth * devicePixelRatio;
    let viewportHeight = webglCanvas.clientHeight * devicePixelRatio;

    const renderObject: RenderObject = {
        vertices: {
            position: { data: new Float32Array(positions), format: 'float32x3' as const },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed' as const, indexCount: indices.length },
        bindingResources: {
            model: { value: mat4.identity([]) },
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
        },
    };

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

    function draw()
    {
        tick++;
        const t = 0.01 * tick;

        reactive(renderObject.bindingResources).view = {
            value: mat4.lookAt([],
                [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
                [0, 2.5, 0],
                [0, 1, 0]),
        };

        reactive(renderObject.bindingResources).projection = {
            value: mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                1000),
        };

        webgpu.submit(submit);
        webgl.submit(submit);

        // 第一帧后进行比较
        if (tick === 1)
        {
            autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
        }

        requestAnimationFrame(draw);
    }
    draw();
});

