import { CanvasRenderPassDescriptor, Submit } from "@feng3d/render-api";
import { WebGL } from "@feng3d/webgl";
import { WebGPU } from "@feng3d/webgpu";
import { mat4 } from "gl-matrix";

import vertexGlsl from "./shaders/vertex.glsl";
import fragmentGlsl from "./shaders/fragment.glsl";
import vertexWgsl from "./shaders/vertex.wgsl";
import fragmentWgsl from "./shaders/fragment.wgsl";

import { sample2Shader } from "./shaders/shader";

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexGlsl = sample2Shader.generateGLSL('vertex', 'main');
    const fragmentGlsl = sample2Shader.generateGLSL('fragment', 'main');
    // const vertexWgsl = sample2Shader.generateWGSL('vertex', 'main');
    // const fragmentWgsl = sample2Shader.generateWGSL('fragment', 'main');

    const canvasRenderPassDescriptor: CanvasRenderPassDescriptor = {
        clearColorValue: [0, 0, 0, 1],
        loadColorOp: 'clear',
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
    };

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU(
        { canvasId: 'webgpu' },
        canvasRenderPassDescriptor
    ).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL(
        { canvasId: 'webgl', webGLcontextId: 'webgl2' },
        canvasRenderPassDescriptor
    );

    // 创建投影矩阵和模型视图矩阵
    const { projectionMatrix, modelViewMatrix } = createMatrices(webgpuCanvas);

    // 创建提交对象
    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    {
                        renderPassObjects: [
                            {
                                pipeline: {
                                    vertex: {
                                        glsl: vertexGlsl,
                                        wgsl: vertexWgsl,
                                    },
                                    fragment: {
                                        glsl: fragmentGlsl,
                                        wgsl: fragmentWgsl,
                                    },
                                    primitive: { topology: 'triangle-strip' },
                                    depthStencil: { depthCompare: 'less-equal' },
                                },
                                vertices: {
                                    aVertexPosition: {
                                        format: 'float32x2',
                                        data: new Float32Array([
                                            1.0, 1.0,
                                            -1.0, 1.0,
                                            1.0, -1.0,
                                            -1.0, -1.0,
                                        ]),
                                    },
                                },
                                draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 4 },
                                bindingResources: {
                                    uProjectionMatrix: { value: projectionMatrix as Float32Array },
                                    uModelViewMatrix: { value: modelViewMatrix as Float32Array },
                                },
                            }
                        ],
                    },
                ],
            },
        ],
    };

    // 提交渲染命令
    webgpu.submit(submit);
    webgl.submit(submit);
});

/**
 * 创建投影矩阵和模型视图矩阵
 */
function createMatrices(canvas: HTMLCanvasElement)
{
    // 创建透视投影矩阵
    const fieldOfView = 45 * Math.PI / 180; // 弧度
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // 创建模型视图矩阵
    const modelViewMatrix = mat4.create();

    // 将绘制位置移动到场景中心
    mat4.translate(modelViewMatrix,
        modelViewMatrix,
        [-0.0, 0.0, -6.0]);

    return { projectionMatrix, modelViewMatrix };
}

