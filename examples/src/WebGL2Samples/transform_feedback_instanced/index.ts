/**
 * Transform Feedback Instanced 示例
 *
 * 演示如何结合 Transform Feedback 和实例化渲染。
 * 1000 个代理在场景中随机漫游。
 */

import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPipeline, Submit, TransformFeedback, TransformFeedbackObject, TransformFeedbackPipeline, VertexAttributes } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 导入原始着色器（调试用）
import vsEmitGlsl from './shaders/vs-emit.glsl';
import vsEmitWgsl from './shaders/vs-emit.wgsl';
import vsDrawGlsl from './shaders/vs-draw.glsl';
import vsDrawWgsl from './shaders/vs-draw.wgsl';
import fsDrawGlsl from './shaders/fs-draw.glsl';
import fsDrawWgsl from './shaders/fs-draw.wgsl';

// 导入 TSL 着色器
import { drawFragmentShader, drawVertexShader, emitVertexShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成着色器代码（变量名必须与导入的相同，便于调试切换）
    const vsEmitGlsl = emitVertexShader.toGLSL();
    const vsEmitWgsl = emitVertexShader.toWGSL({
        varyings: ['v_offset', 'v_rotation'],
        bufferMode: 'SEPARATE_ATTRIBS',
    });
    const vsDrawGlsl = drawVertexShader.toGLSL(2);
    const vsDrawWgsl = drawVertexShader.toWGSL();
    const fsDrawGlsl = drawFragmentShader.toGLSL(2);
    const fsDrawWgsl = drawFragmentShader.toWGSL(drawVertexShader);

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });

    // 初始化数据
    const NUM_INSTANCES = 1000;

    // 三角形顶点位置（本地坐标）
    const trianglePositions = new Float32Array([
        0.015, 0.0,
        -0.010, 0.010,
        -0.010, -0.010,
    ]);

    // 初始化实例数据
    const instanceOffsets = new Float32Array(NUM_INSTANCES * 2);
    const instanceRotations = new Float32Array(NUM_INSTANCES);
    const instanceColors = new Float32Array(NUM_INSTANCES * 3);

    for (let i = 0; i < NUM_INSTANCES; i++)
    {
        const oi = i * 2;
        const ci = i * 3;

        // 随机位置
        instanceOffsets[oi] = Math.random() * 2.0 - 1.0;
        instanceOffsets[oi + 1] = Math.random() * 2.0 - 1.0;

        // 随机旋转
        instanceRotations[i] = Math.random() * 2 * Math.PI;

        // 随机颜色
        instanceColors[ci] = Math.random();
        instanceColors[ci + 1] = Math.random();
        instanceColors[ci + 2] = Math.random();
    }

    // Ping-pong 缓冲区索引
    let currentSourceIdx = 0;

    // 创建两组缓冲区用于 ping-pong
    const vertexArrays: { vertices: VertexAttributes }[][] = [];
    const transformFeedbacks: TransformFeedback[] = [];

    for (let i = 0; i < 2; i++)
    {
        // 复制数据以创建独立的缓冲区
        const offsets = instanceOffsets.slice();
        const rotations = instanceRotations.slice();

        // Transform Feedback 顶点属性（只包含需要更新的属性）
        const transformVertices: VertexAttributes = {
            a_offset: { data: offsets, format: 'float32x2' },
            a_rotation: { data: rotations, format: 'float32' },
        };

        // 绘制顶点属性（包含所有属性，实例化渲染）
        const drawVertices: VertexAttributes = {
            a_offset: { data: offsets, format: 'float32x2', stepMode: 'instance' },
            a_rotation: { data: rotations, format: 'float32', stepMode: 'instance' },
            a_position: { data: trianglePositions, format: 'float32x2' },
            a_color: { data: instanceColors, format: 'float32x3', stepMode: 'instance' },
        };

        vertexArrays[i] = [
            { vertices: transformVertices },
            { vertices: drawVertices },
        ];

        // Transform Feedback 绑定
        transformFeedbacks[i] = {
            bindBuffers: [
                { index: 0, data: offsets },
                { index: 1, data: rotations },
            ],
        };
    }

    // Transform Feedback Pipeline
    const transformPipeline: TransformFeedbackPipeline = {
        vertex: { code: vsEmitGlsl, wgsl: vsEmitWgsl },
        transformFeedbackVaryings: {
            varyings: ['v_offset', 'v_rotation'],
            bufferMode: 'SEPARATE_ATTRIBS',
        },
    };

    // 绘制 Pipeline
    const drawPipeline: RenderPipeline = {
        vertex: { code: vsDrawGlsl, wgsl: vsDrawWgsl },
        fragment: {
            code: fsDrawGlsl,
            wgsl: fsDrawWgsl,
            targets: [{
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one' },
                    alpha: { srcFactor: 'src-alpha', dstFactor: 'one' },
                },
            }],
        },
        primitive: { topology: 'triangle-list' },
    };

    // Transform Feedback 渲染对象
    const transformRO: TransformFeedbackObject = {
        pipeline: transformPipeline,
        vertices: null,
        transformFeedback: null,
        uniforms: {},
        draw: { __type__: 'DrawVertex', vertexCount: NUM_INSTANCES },
    };

    // 绘制渲染对象
    const renderRO: RenderObject = {
        viewport: { x: 0, y: 0, width: webglCanvas.width, height: webglCanvas.height },
        pipeline: drawPipeline,
        bindingResources: {},
        draw: { __type__: 'DrawVertex', vertexCount: 3, instanceCount: NUM_INSTANCES },
    };

    // 提交对象
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    __type__: 'TransformFeedbackPass',
                    transformFeedbackObjects: [transformRO],
                },
                {
                    descriptor: { colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }] },
                    renderPassObjects: [renderRO],
                },
            ],
        }],
    };

    // 应用启动时间
    const appStartTime = Date.now();

    // 更新粒子状态
    function updateParticles()
    {
        const time = Date.now() - appStartTime;
        const destinationIdx = (currentSourceIdx + 1) % 2;

        // 切换源和目标缓冲区
        transformRO.vertices = vertexArrays[currentSourceIdx][0].vertices;
        transformRO.transformFeedback = transformFeedbacks[destinationIdx];

        // 更新时间 uniform
        reactive(transformRO.uniforms).u_time = { value: time };

        // 切换缓冲区索引
        currentSourceIdx = (currentSourceIdx + 1) % 2;
    }

    // 比较状态
    let comparisonDone = false;
    const comparisonDelay = 1000; // 1秒后进行比较

    // 渲染循环
    function render()
    {
        updateParticles();

        // 更新渲染顶点数据
        reactive(renderRO).vertices = vertexArrays[currentSourceIdx][1].vertices;

        // 提交 WebGL 渲染
        webgl.submit(submit);

        // 提交 WebGPU 渲染
        webgpu.submit(submit);

        // 1秒后进行比较（等待系统稳定）
        const elapsed = Date.now() - appStartTime;
        if (!comparisonDone && elapsed >= comparisonDelay)
        {
            comparisonDone = true;
            autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0).then((result) =>
            {
                addComparisonExplanation(result);
            });
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
});

/**
 * 添加比较结果的解释说明
 */
function addComparisonExplanation(result: { isMatch: boolean; difference: number })
{
    const container = document.getElementById('comparison-result');
    if (!container) return;

    const explanation = document.createElement('div');
    explanation.style.cssText = 'margin-top: 12px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 13px; color: #856404;';

    if (!result.isMatch)
    {
        explanation.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px;">⚠️ 不一致原因：</div>
            <div style="margin-bottom: 8px;">
                WebGL 和 WebGPU 各自维护独立的缓冲区，随机数精度和浮点运算存在微小差异，累积误差会随时间增加。
            </div>
        `;
    }
    else
    {
        explanation.innerHTML = `
            <div style="color: #155724; background: #d4edda; border-color: #c3e6cb; padding: 10px; border-radius: 4px;">
                ✓ WebGL 和 WebGPU 渲染结果一致
            </div>
        `;
    }

    container.appendChild(explanation);
}
