import { RenderPipeline, Sampler, Submit, Texture } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
import { vertexShader, fragmentShader } from './shaders/shader';

// 辅助函数：加载图像
function loadImage(url: string, onload: (img: HTMLImageElement) => void): HTMLImageElement
{
    const img = new Image();
    img.onload = function ()
    {
        onload(img);
    };
    img.src = url;
    return img;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    // const vertexWgsl = vertexShader.toWGSL();
    // const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
    webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
    webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 加载图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 创建纹理资源
        const texture: Texture = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: img, flipY: false }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'linear',
            magFilter: 'linear',
        };

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

        // 渲染提交
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
                                pipeline: program,
                                draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 3 },
                                bindingResources: {
                                    diffuse: { texture, sampler },
                                    u_imageSize: { value: [webglCanvas.width / 2, webglCanvas.height / 2] },
                                },
                            }],
                        },
                    ],
                },
            ],
        };

        // 执行渲染
        webgpu.submit(submit);
        webgl.submit(submit);

        // 第一帧后进行比较
        autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
    });
});