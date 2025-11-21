import { Submit } from "@feng3d/render-api";
import { WebGL } from "@feng3d/webgl";
import { WebGPU } from "@feng3d/webgpu";
import { generateGLSL, generateShaders, generateWGSL, ShaderConfig } from "@feng3d/tsl";

import fragmentGlsl from "./shaders/fragment.glsl";
import fragmentWgsl from "./shaders/fragment.wgsl";
import vertexGlsl from "./shaders/vertex.glsl";
import vertexWgsl from "./shaders/vertex.wgsl";
import fragmentJson from "./shaders/fragment.frag.json";
import vertexJson from "./shaders/vertex.vert.json";
import { helloTriangle } from "./shaders/shader";

document.addEventListener('DOMContentLoaded', async () =>
{
    // 方式1: 从 JSON 配置生成着色器代码
    let fragmentGlsl = generateGLSL(fragmentJson);
    let fragmentWgsl = generateWGSL(fragmentJson);
    let vertexGlsl = generateGLSL(vertexJson);
    let vertexWgsl = generateWGSL(vertexJson);

    // 方式2: 在同一个类中定义 vertex 和 fragment（推荐）
    const shader = new helloTriangle();
    vertexGlsl = shader.generateGLSL('vertex');
    vertexWgsl = shader.generateWGSL('vertex');
    fragmentGlsl = shader.generateGLSL('fragment');
    fragmentWgsl = shader.generateWGSL('fragment');

    const devicePixelRatio = window.devicePixelRatio || 1;

    //
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }, { clearColorValue: [0.0, 0.0, 0.0, 1.0] }).init(); // 初始化WebGPU

    //
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' }, { clearColorValue: [0.0, 0.0, 0.0, 1.0] }); // 初始化WebGL

    //
    const submit: Submit = { // 一次GPU提交
        commandEncoders: [ // 命令编码列表
            {
                passEncoders: [ // 通道编码列表
                    { // 渲染通道
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
