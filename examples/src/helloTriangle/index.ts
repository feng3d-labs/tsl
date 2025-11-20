import { reactive } from "@feng3d/reactivity";
import { RenderPass, Submit } from "@feng3d/render-api";
import { WebGL } from "@feng3d/webgl";
import { WebGPU } from "@feng3d/webgpu";

document.addEventListener('DOMContentLoaded', async () =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    //
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU().init(); // 初始化WebGPU

    //
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: webglCanvas, webGLcontextId: 'webgl2' }); // 初始化WebGL

    //
    const submit: Submit = { // 一次GPU提交
        commandEncoders: [ // 命令编码列表
            {
                passEncoders: [ // 通道编码列表
                    { // 渲染通道
                        descriptor: { // 渲染通道描述
                            colorAttachments: [{ // 颜色附件
                                // view: { texture: { context: { canvasId: canvas.id } } }, // 绘制到canvas上
                                clearValue: [0.0, 0.0, 0.0, 1.0], // 渲染前填充颜色
                            }],
                        },
                        renderPassObjects: [{ // 渲染对象
                            pipeline: { // 渲染管线
                                vertex: { // 顶点着色器
                                    glsl: `
                                    attribute vec2 position;

                                    void main() {
                                        gl_Position = vec4(position, 0.0, 1.0);
                                    }
                                    `,
                                    wgsl: `
                                    @vertex
                                    fn main(
                                        @location(0) position: vec2<f32>,
                                    ) -> @builtin(position) vec4<f32> {
                                        return vec4<f32>(position, 0.0, 1.0);
                                    }
                                    `  },
                                fragment: { // 片段着色器
                                    glsl: `
                                    precision highp float;
                                    uniform vec4 color;
                                    void main() {
                                        gl_FragColor = color;
                                    }
                                    `,
                                    wgsl: `
                                    @binding(0) @group(0) var<uniform> color : vec4<f32>;
                                    @fragment
                                    fn main() -> @location(0) vec4f {
                                        return color;
                                    }
                                `,
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

    webgl.submit(submit);

    reactive((submit.commandEncoders[0].passEncoders[0] as RenderPass).descriptor.colorAttachments[0]).view = { texture: { context: { canvasId: webgpuCanvas.id } } };

    webgpu.submit(submit);
});
