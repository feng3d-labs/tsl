import { RenderObject, RenderPass, RenderPassDescriptor, RenderPipeline, Sampler, Texture, TextureView, VertexAttributes } from '@feng3d/render-api';
import { BlitFramebuffer, BlitFramebufferItem, WebGL } from '@feng3d/webgl';
import { loadImage } from '../../utils/loadImage';

// 直接导入预生成的着色器文件（调试时可注释掉TSL生成的代码，使用这些原始着色器）
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';
// 导入TSL着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 初始化WebGL（BlitFramebuffer 是 WebGL 特有功能）
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 渲染管线
    const pipeline: RenderPipeline = {
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

    // 顶点数据
    const vertexPosBuffer = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);
    const vertexTexBuffer = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 0.0,
        0.0, 1.0,
    ]);

    const vertices: VertexAttributes = {
        position: { data: vertexPosBuffer, format: 'float32x2' },
        texcoord: { data: vertexTexBuffer, format: 'float32x2' },
    };

    // 加载图片
    const image = await loadImage('./images/Di-3d.png');

    const FRAMEBUFFER_SIZE = {
        x: image.width,
        y: image.height,
    };

    // 漫反射纹理
    const textureDiffuse: Texture = {
        descriptor: {
            size: [image.width, image.height],
            format: 'rgba8unorm',
        },
        sources: [{
            image, flipY: true,
        }],
    };
    const samplerDiffuse: Sampler = {
        minFilter: 'linear',
        magFilter: 'linear',
    };

    // 颜色缓冲纹理
    const textureColorBuffer: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            size: [FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y],
        },
    };
    const samplerColorBuffer: Sampler = {
        minFilter: 'linear',
        magFilter: 'linear',
    };

    // Renderbuffer（使用 TextureView 替代）
    const colorRenderbuffer: TextureView = {
        texture: {
            descriptor: {
                format: 'rgba8unorm',
                size: [FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y],
            },
        },
    };

    // 渲染对象1：渲染到 FBO
    const renderObject1: RenderObject = {
        viewport: { x: 0, y: 0, width: FRAMEBUFFER_SIZE.x, height: FRAMEBUFFER_SIZE.y },
        pipeline,
        bindingResources: {
            MVP: {
                value: new Float32Array([
                    0.8, 0.0, 0.0, 0.0,
                    0.0, 0.8, 0.0, 0.0,
                    0.0, 0.0, 0.8, 0.0,
                    0.0, 0.0, 0.0, 1.0,
                ]),
            },
            diffuse: { texture: textureDiffuse, sampler: samplerDiffuse },
        },
        vertices,
        draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 6 },
    };

    // FBO 渲染 Pass
    const fboRenderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{
                view: colorRenderbuffer,
                clearValue: [0.3, 0.3, 0.3, 1.0],
            }],
        },
        renderPassObjects: [renderObject1],
    };

    // 解析帧缓冲
    const framebufferResolve: RenderPassDescriptor = {
        colorAttachments: [{
            view: { texture: textureColorBuffer, baseMipLevel: 0 },
            clearValue: [0.7, 0.0, 0.0, 1.0],
        }],
    };

    const renderPassResolve: RenderPass = {
        descriptor: framebufferResolve,
    };

    // Blit 操作：创建棋盘格效果
    const blitFramebuffers: BlitFramebufferItem[] = [];
    const TILE = 4;
    const BORDER = 2;
    for (let j = 0; j < TILE; j++)
    {
        for (let i = 0; i < TILE; i++)
        {
            if ((i + j) % 2)
            {
                continue;
            }

            blitFramebuffers.push(
                [0, 0, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y,
                    FRAMEBUFFER_SIZE.x / TILE * (i + 0) + BORDER,
                    FRAMEBUFFER_SIZE.x / TILE * (j + 0) + BORDER,
                    FRAMEBUFFER_SIZE.y / TILE * (i + 1) - BORDER,
                    FRAMEBUFFER_SIZE.y / TILE * (j + 1) - BORDER,
                    'COLOR_BUFFER_BIT', 'LINEAR'],
            );
        }
    }

    const blitFramebuffer: BlitFramebuffer = {
        __type__: 'BlitFramebuffer',
        read: fboRenderPass.descriptor,
        draw: renderPassResolve.descriptor,
        blitFramebuffers,
    };

    // 渲染对象2：将结果渲染到屏幕
    const renderObject2: RenderObject = {
        viewport: { x: 0, y: 0, width: webglCanvas.width, height: webglCanvas.height },
        pipeline,
        bindingResources: {
            MVP: {
                value: new Float32Array([
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0,
                ]),
            },
            diffuse: { texture: textureColorBuffer, sampler: samplerColorBuffer },
        },
        vertices,
        draw: { __type__: 'DrawVertex', firstVertex: 0, vertexCount: 6 },
    };

    // 最终渲染 Pass
    const renderPass2: RenderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
        },
        renderPassObjects: [renderObject2],
    };

    // 执行渲染
    webgl.submit({
        commandEncoders: [{
            passEncoders: [
                fboRenderPass,
                blitFramebuffer,
                renderPass2,
            ],
        }],
    });

    // 更新比较结果显示
    const resultDiv = document.getElementById('comparison-result');
    if (resultDiv)
    {
        resultDiv.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #4a90e2;">仅 WebGL 支持</div>
            <div>BlitFramebuffer 是 WebGL 特有功能，WebGPU 暂不支持此操作</div>
        `;
    }
});
