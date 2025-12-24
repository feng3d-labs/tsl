/**
 * texture_vertex 示例
 *
 * 演示在顶点着色器中使用纹理查找实现位移贴图（Displacement Mapping）。
 *
 * 关键技术点：
 * 1. 顶点着色器中的纹理采样（需要使用 textureLod 因为没有导数信息）
 * 2. 根据高度图沿法线方向位移顶点
 * 3. 使用 dFdx/dFdy 计算平面法线
 * 4. 使用自定义 LOD 计算进行 textureLod 采样
 *
 * TSL 用法：
 * - 顶点着色器纹理采样：`texture(sampler, uv)` 或 `textureLod(sampler, uv, lod)`
 * - 自定义函数：`func('name', [params], returnType, body)`
 * - 显式 LOD 采样：`textureLod(sampler, uv, level)`
 */

import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/render-api';
import { reactive } from '@feng3d/reactivity';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'gl-matrix';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 导入调试用原始着色器
import fragmentGlsl from './shaders/fragment.glsl';
import fragmentWgsl from './shaders/fragment.wgsl';
import vertexGlsl from './shaders/vertex.glsl';
import vertexWgsl from './shaders/vertex.wgsl';

// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 辅助函数：加载图像
function loadImage(url: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// 生成平面网格
function createPlane(segmentsX: number, segmentsZ: number, width: number, depth: number)
{
    const positions: number[] = [];
    const normals: number[] = [];
    const texcoords: number[] = [];
    const indices: number[] = [];

    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    // 生成顶点
    for (let z = 0; z <= segmentsZ; z++)
    {
        for (let x = 0; x <= segmentsX; x++)
        {
            const u = x / segmentsX;
            const v = z / segmentsZ;

            const px = u * width - halfWidth;
            const pz = v * depth - halfDepth;

            positions.push(px, 0, pz);
            normals.push(0, 1, 0);
            texcoords.push(u, v);
        }
    }

    // 生成索引
    for (let z = 0; z < segmentsZ; z++)
    {
        for (let x = 0; x < segmentsX; x++)
        {
            const a = x + (segmentsX + 1) * z;
            const b = x + (segmentsX + 1) * (z + 1);
            const c = (x + 1) + (segmentsX + 1) * (z + 1);
            const d = (x + 1) + (segmentsX + 1) * z;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texcoords: new Float32Array(texcoords),
        indices: new Uint16Array(indices),
    };
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码
    // const vertexGlsl = vertexShader.toGLSL(2);
    // const fragmentGlsl = fragmentShader.toGLSL(2);
    // const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    // const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 加载高度图纹理
    const image = await loadImage('./images/heightmap.jpg');

    // 创建纹理（用于位移贴图和漫反射）
    // 注意：与原始示例保持一致，使用 mipLevelCount: 1
    const texture: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            mipLevelCount: 1,
            size: [256, 256],
        },
        sources: [{
            image,
            flipY: false,
        }],
    };

    // 创建采样器（与原始示例保持一致，使用 nearest 过滤）
    const sampler: Sampler = {
        minFilter: 'nearest',
        magFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    };

    // 创建平面网格（64x64 细分）
    const plane = createPlane(64, 64, 4, 4);

    // 渲染管线
    const program: RenderPipeline = {
        vertex: {
            glsl: vertexGlsl,
            wgsl: vertexWgsl,
        },
        fragment: {
            glsl: fragmentGlsl,
            wgsl: fragmentWgsl,
            targets: [{}],
        },
        depthStencil: {},
        primitive: { topology: 'triangle-list', cullFace: 'back' },
    };

    // 初始化矩阵
    const eyeVec3 = vec3.create();
    vec3.set(eyeVec3, 4, 3, 1);
    const centerVec3 = vec3.create();
    vec3.set(centerVec3, 0, 0.5, 0);
    const upVec3 = vec3.create();
    vec3.set(upVec3, 0, 1, 0);

    const mvMatrix = mat4.create();
    mat4.lookAt(mvMatrix, eyeVec3, centerVec3, upVec3);

    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, 0.785, 1, 1, 1000);

    // 渲染对象
    const renderObject: RenderObject = {
        pipeline: program,
        bindingResources: {
            mvMatrix: { value: mvMatrix as Float32Array },
            pMatrix: { value: perspectiveMatrix as Float32Array },
            displacementMap: { texture, sampler },
            diffuse: { texture, sampler },
        },
        vertices: {
            position: { data: plane.positions, format: 'float32x3' },
            normal: { data: plane.normals, format: 'float32x3' },
            texcoord: { data: plane.texcoords, format: 'float32x2' },
        },
        indices: plane.indices,
        draw: { __type__: 'DrawIndexed', indexCount: plane.indices.length },
    };

    // 渲染通道
    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
            depthStencilAttachment: { depthLoadOp: 'clear' },
        },
        renderPassObjects: [renderObject],
    };

    // 提交对象
    const submit: Submit = {
        commandEncoders: [{ passEncoders: [renderPass] }],
    };

    // 旋转参数
    const orientation = [0.0, 0.0, 0.0];

    // 鼠标交互
    let mouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (event: MouseEvent) =>
    {
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    };

    const handleMouseUp = () =>
    {
        mouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) =>
    {
        if (!mouseDown) return;

        const newX = event.clientX;
        const newY = event.clientY;

        const deltaX = newX - lastMouseX;
        const deltaY = newY - lastMouseY;

        const m = mat4.create();
        mat4.rotateX(m, m, deltaX / 100.0);
        mat4.rotateY(m, m, deltaY / 100.0);

        mat4.multiply(mvMatrix, mvMatrix, m);

        lastMouseX = newX;
        lastMouseY = newY;
    };

    // 为两个 canvas 添加鼠标事件
    webglCanvas.addEventListener('mousedown', handleMouseDown);
    webglCanvas.addEventListener('mouseup', handleMouseUp);
    webglCanvas.addEventListener('mousemove', handleMouseMove);
    webgpuCanvas.addEventListener('mousedown', handleMouseDown);
    webgpuCanvas.addEventListener('mouseup', handleMouseUp);
    webgpuCanvas.addEventListener('mousemove', handleMouseMove);

    // 是否已完成首帧比较
    let firstFrameCompared = false;

    // 渲染循环
    function render()
    {
        // 自动旋转
        orientation[0] = 0.00020; // yaw
        orientation[1] = 0.00010; // pitch
        orientation[2] = 0.00005; // roll

        mat4.rotateX(mvMatrix, mvMatrix, orientation[0] * Math.PI);
        mat4.rotateY(mvMatrix, mvMatrix, orientation[1] * Math.PI);
        mat4.rotateZ(mvMatrix, mvMatrix, orientation[2] * Math.PI);

        // 更新绑定资源
        reactive(renderObject.bindingResources).mvMatrix = { value: mvMatrix as Float32Array };
        reactive(renderObject.bindingResources).pMatrix = { value: perspectiveMatrix as Float32Array };

        // 提交渲染
        webgl.submit(submit);
        webgpu.submit(submit);

        // 首帧比较
        if (!firstFrameCompared)
        {
            firstFrameCompared = true;
            // 延迟一帧进行比较，确保渲染完成
            requestAnimationFrame(() =>
            {
                autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 1);
            });
        }

        requestAnimationFrame(render);
    }

    // 开始渲染循环
    render();
});

