import { RenderObject, RenderPipeline, Submit, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入TSL着色器
import { fragmentShader, vertexShader } from './shaders/shader';
import { reactive } from '@feng3d/reactivity';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // -- 初始化缓冲区数据 --

    // 索引数据
    const elementData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    // vec3 position, vec3 normal, vec4 color
    const vertices = new Float32Array([
        -1.0, -1.0, -0.5, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
        1.0, -1.0, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0,
        1.0, 1.0, -0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        -1.0, 1.0, -0.5, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    ]);

    // PerDraw UBO: mat4 P, mat4 MV, mat4 Mnormal
    const transforms = {
        transform: {
            P: [1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0,
            ],
            MV: [0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.0, 0.0, 0.0, 1.0,
            ],
            Mnormal: [
                1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0,
            ],
        },
    };

    // PerPass UBO: Light position
    const lightPos = {
        light: {
            position: [0.0, 0.0, 0.0],
        },
    };

    // PerScene UBO: vec3 ambient, diffuse, specular, float shininess
    const material = {
        material: {
            ambient: [0.1, 0.0, 0.0],
            diffuse: [0.5, 0.0, 0.0],
            specular: [1.0, 1.0, 1.0],
            shininess: 4.0,
        },
    };

    // 生成着色器代码（注释掉以下代码可切换到原始着色器调试）
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            glsl: vertexGlsl,
            wgsl: vertexWgsl,
        },
        fragment: {
            glsl: fragmentGlsl,
            wgsl: fragmentWgsl,
            targets: [{ blend: {} }],
        },
        primitive: { topology: 'triangle-list' },
    };

    // 顶点属性
    const vertexArray: { vertices?: VertexAttributes } = {
        vertices: {
            position: { data: vertices, format: 'float32x3', arrayStride: 40, offset: 0 },
            normal: { data: vertices, format: 'float32x3', arrayStride: 40, offset: 12 },
            color: { data: vertices, format: 'float32x4', arrayStride: 40, offset: 24 },
        },
    };

    // 绑定资源
    const bindingResources = {
        PerDraw: { value: transforms },
        PerPass: { value: lightPos },
        PerScene: { value: material },
    };

    // 渲染对象
    const renderObject: RenderObject = {
        bindingResources,
        vertices: vertexArray.vertices,
        indices: elementData,
        draw: { __type__: 'DrawIndexed', indexCount: 6, firstIndex: 0 },
        pipeline: program,
    };

    // 渲染提交
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: {
                        colorAttachments: [{
                            clearValue: [0.0, 0.0, 0.0, 1.0],
                            loadOp: 'clear',
                        }],
                    },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

    let uTime = 0;
    let firstFrame = true;

    function render()
    {
        uTime += 0.01;

        // 更新 MV 矩阵
        transforms.transform.MV[0] = 0.1 * Math.cos(uTime) + 0.4;
        reactive(transforms.transform).MV = transforms.transform.MV.concat(); // 强制更新

        // 更新光源位置
        lightPos.light.position[0] = Math.cos(3 * uTime);
        lightPos.light.position[1] = Math.sin(6 * uTime);
        reactive(lightPos.light).position = lightPos.light.position.concat(); // 强制更新

        // 执行渲染
        webgl.submit(submit);
        webgpu.submit(submit);

        // 第一帧后进行比较
        if (firstFrame)
        {
            firstFrame = false;
            autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
        }

        requestAnimationFrame(render);
    }

    render();
});
