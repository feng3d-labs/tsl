import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试用）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

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

// 辅助函数：初始化画布尺寸
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码（变量名与导入的相同，便于调试切换）
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 加载图像
    loadImage('./images/di-animation-array.jpg', (image) =>
    {
        const NUM_IMAGES = 3;
        const IMAGE_SIZE = {
            width: 960,
            height: 540,
        };

        // 使用 canvas 获取图像的像素数据数组
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_SIZE.width;
        canvas.height = IMAGE_SIZE.height * NUM_IMAGES;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, IMAGE_SIZE.width, IMAGE_SIZE.height * NUM_IMAGES);
        const pixels = new Uint8Array(imageData.data.buffer);

        // 顶点数据
        const positions = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            1.0, 1.0,
            1.0, 1.0,
            -1.0, 1.0,
            -1.0, -1.0,
        ]);

        const texCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
        ]);

        // 顶点数组
        const vertexArray: { vertices?: VertexAttributes } = {
            vertices: {
                position: { data: positions, format: 'float32x2' },
                texcoord: { data: texCoords, format: 'float32x2' },
            },
        };

        // 创建 2D 纹理数组
        const texture: Texture = {
            descriptor: {
                size: [IMAGE_SIZE.width, IMAGE_SIZE.height, NUM_IMAGES],
                dimension: '2d-array',
                format: 'rgba8unorm',
            },
            sources: [{ __type__: 'TextureDataSource', size: [IMAGE_SIZE.width, IMAGE_SIZE.height, NUM_IMAGES], data: pixels }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'linear',
            magFilter: 'linear',
        };

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 渲染管线
        const program: RenderPipeline = {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentGlsl,
                wgsl: fragmentWgsl,
            },
            primitive: { topology: 'triangle-list' },
        };

        // 渲染对象
        const ro: RenderObject = {
            pipeline: program,
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler },
                layer: { value: 0 },
            },
            vertices: vertexArray.vertices,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        };

        // 渲染通道
        const rp: RenderPass = {
            descriptor: { colorAttachments: [{ clearValue: [1.0, 1.0, 1.0, 1.0], loadOp: 'clear' }] },
            renderPassObjects: [ro],
        };

        // 提交对象
        const submit: Submit = {
            commandEncoders: [{ passEncoders: [rp] }],
        };

        let frame = 0;
        let isFirstFrame = true;

        (function render()
        {
            // 更新纹理层
            reactive(ro.bindingResources!).layer = { value: frame };

            // 执行渲染
            webgl.submit(submit);
            webgpu.submit(submit);

            // 第一帧后进行比较
            if (isFirstFrame)
            {
                isFirstFrame = false;
                autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);
            }

            // 切换到下一帧
            frame = (frame + 1) % NUM_IMAGES;

            // 每 200ms 切换一帧
            setTimeout(() =>
            {
                requestAnimationFrame(render);
            }, 200);
        })();
    });
});

