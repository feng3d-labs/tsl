import { RenderPassDescriptor, Submit } from "@feng3d/render-api";
import { reactive } from "@feng3d/reactivity";
import { WebGL } from "@feng3d/webgl";
import { WebGPU } from "@feng3d/webgpu";
import { mat4 } from "gl-matrix";

// 导入原始 GLSL 和 WGSL 文件作为参考和备选
import vertexGlsl from "./shaders/vertex.glsl";
import fragmentGlsl from "./shaders/fragment.glsl";
import vertexWgsl from "./shaders/vertex.wgsl";
import fragmentWgsl from "./shaders/fragment.wgsl";

import { vertexShader, fragmentShader } from "./shaders/shader";

let squareRotation = 0.0;

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
    const webgpu = await new WebGPU(
        { canvasId: 'webgpu' }
    ).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL(
        { canvasId: 'webgl', webGLcontextId: 'webgl2' }
    );

    // 创建投影矩阵和模型视图矩阵
    const { projectionMatrix, modelViewMatrix } = drawScene(webgpuCanvas, 0);

    // 创建渲染对象
    const renderObject = {
        pipeline: {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentGlsl,
                wgsl: fragmentWgsl,
            },
            depthStencil: { depthCompare: 'less-equal' as const },
            primitive: { topology: 'triangle-strip' as const },
        },
        vertices: {
            aVertexPosition: {
                format: 'float32x2' as const,
                data: new Float32Array([
                    1.0, 1.0,
                    -1.0, 1.0,
                    1.0, -1.0,
                    -1.0, -1.0,
                ]),
            },
            aVertexColor: {
                format: 'float32x4' as const,
                data: new Float32Array([
                    1.0, 1.0, 1.0, 1.0, // white
                    1.0, 0.0, 0.0, 1.0, // red
                    0.0, 1.0, 0.0, 1.0, // green
                    0.0, 0.0, 1.0, 1.0, // blue
                ]),
            },
        },
        draw: { __type__: 'DrawVertex' as const, firstVertex: 0, vertexCount: 4 },
        bindingResources: {
            uProjectionMatrix: { value: projectionMatrix as Float32Array },
            uModelViewMatrix: { value: modelViewMatrix as Float32Array },
        },
    };

    const renderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
            }],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        },
        renderPassObjects: [renderObject],
    };

    let then = 0;

    // 绘制场景
    function render(now: number)
    {
        now *= 0.001; // 转换为秒
        const deltaTime = now - then;
        then = now;

        const { projectionMatrix, modelViewMatrix } = drawScene(webgpuCanvas, deltaTime);

        const bindingResources = reactive(renderObject.bindingResources);
        bindingResources.uProjectionMatrix = { value: projectionMatrix as Float32Array };
        bindingResources.uModelViewMatrix = { value: modelViewMatrix as Float32Array };

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [renderPass],
            }],
        };

        webgpu.submit(submit);
        webgl.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});

/**
 * 绘制场景
 */
function drawScene(canvas: HTMLCanvasElement, deltaTime: number)
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

    // 旋转
    squareRotation += deltaTime;
    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        squareRotation,
        [0, 0, 1]);

    return { projectionMatrix, modelViewMatrix };
}

