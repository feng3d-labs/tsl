import { RenderPassObject, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试用）
import fragmentBicubicGlsl from './shaders/fragment_bicubic.glsl';
import fragmentBicubicWgsl from './shaders/fragment_bicubic.wgsl';
import fragmentOffsetGlsl from './shaders/fragment_offset.glsl';
import fragmentOffsetWgsl from './shaders/fragment_offset.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
import { fragmentShaderBicubic, fragmentShaderOffset, vertexShader } from './shaders/shader';

/**
 * 加载图像
 */
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

/**
 * 初始化画布尺寸
 */
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 视口枚举
const Corners = {
    LEFT: 0,
    RIGHT: 1,
    MAX: 2,
};

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentOffsetGlsl = fragmentShaderOffset.toGLSL(2);
    const fragmentBicubicGlsl = fragmentShaderBicubic.toGLSL(2);

    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentOffsetWgsl = fragmentShaderOffset.toWGSL(vertexShader);
    const fragmentBicubicWgsl = fragmentShaderBicubic.toWGSL(vertexShader);

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 计算视口
    const viewports: { x: number, y: number, width: number, height: number }[] = [];

    viewports[Corners.LEFT] = {
        x: 0,
        y: webglCanvas.height / 4,
        width: webglCanvas.width / 2,
        height: webglCanvas.height / 2,
    };

    viewports[Corners.RIGHT] = {
        x: webglCanvas.width / 2,
        y: webglCanvas.height / 4,
        width: webglCanvas.width / 2,
        height: webglCanvas.height / 2,
    };

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

    // 顶点属性
    const vertices: VertexAttributes = {
        position: { data: positions, format: 'float32x2' },
        texcoord: { data: texCoords, format: 'float32x2' },
    };

    // 加载纹理图像
    loadImage('./images/Di-3d.png', (img) =>
    {
        // 创建纹理
        const texture: Texture = {
            descriptor: {
                size: [img.width, img.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: img, mipLevel: 0, flipY: false }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'nearest',
            magFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        };

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 偏移量
        const offset = new Int32Array([100, -80]);

        // 带偏移的着色器程序
        const programOffset: RenderPipeline = {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentOffsetGlsl,
                wgsl: fragmentOffsetWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 无偏移的着色器程序（使用 texelFetchOffset）
        const programBicubic: RenderPipeline = {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentBicubicGlsl,
                wgsl: fragmentBicubicWgsl,
                targets: [{ blend: {} }],
            },
            primitive: { topology: 'triangle-list' },
        };

        // 创建渲染对象
        const renderObjects: RenderPassObject[] = [];

        // 左侧：带偏移
        renderObjects.push({
            pipeline: programOffset,
            vertices,
            viewport: viewports[Corners.LEFT],
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler },
                offset: { value: offset },
            },
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
        });

        // 右侧：无偏移
        renderObjects.push({
            pipeline: programBicubic,
            vertices,
            viewport: viewports[Corners.RIGHT],
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler },
            },
            draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
        });

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
                            renderPassObjects: renderObjects,
                        },
                    ],
                },
            ],
        };

        // 执行渲染
        webgl.submit(submit);
        webgpu.submit(submit);

        // 第一帧后进行比较
        autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0);

        // 删除资源
        webgl.deleteTexture(texture);
        webgl.deleteProgram(programOffset);
        webgl.deleteProgram(programBicubic);
    });
});

