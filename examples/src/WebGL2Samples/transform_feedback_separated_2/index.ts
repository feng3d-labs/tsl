import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPipeline, Submit, TransformFeedback, TransformFeedbackObject, TransformFeedbackPipeline, VertexAttributes, VertexData } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';
import { autoCompareFirstFrame } from '../../utils/frame-comparison';

// 直接导入预生成的着色器文件（调试时可注释掉 TSL 生成的代码，使用这些原始着色器）
import fragmentDrawGlsl from './shaders/fragment-draw.glsl';
import fragmentDrawWgsl from './shaders/fragment-draw.wgsl';
import computeEmitWgsl from './shaders/compute-emit.wgsl';
import vertexDrawGlsl from './shaders/vertex-draw.glsl';
import vertexDrawWgsl from './shaders/vertex-draw.wgsl';
import vertexEmitGlsl from './shaders/vertex-emit.glsl';
// 导入 TSL 着色器
import { drawFragmentShader, drawVertexShader, emitVertexShader } from './shaders/shader';

// 粒子系统配置
const NUM_PARTICLES = 1000;
const ACCELERATION = -1.0;

// 属性位置常量
const POSITION_LOCATION = 0;
const VELOCITY_LOCATION = 1;
const SPAWNTIME_LOCATION = 2;
const LIFETIME_LOCATION = 3;
const ID_LOCATION = 4;
const NUM_LOCATIONS = 5;

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
    const vertexEmitGlsl = emitVertexShader.toGLSL();
    // 生成 WGSL 计算着色器（用于 WebGPU Transform Feedback 模拟）
    // 分离模式：v_position, v_velocity, v_spawntime, v_lifetime 输出到不同的缓冲区
    const computeEmitWgsl = emitVertexShader.toWGSL({
        varyings: ['v_position', 'v_velocity', 'v_spawntime', 'v_lifetime'],
        bufferMode: 'SEPARATE_ATTRIBS',
    });
    const vertexDrawGlsl = drawVertexShader.toGLSL(2);
    const fragmentDrawGlsl = drawFragmentShader.toGLSL(2);
    const vertexDrawWgsl = drawVertexShader.toWGSL();
    const fragmentDrawWgsl = drawFragmentShader.toWGSL(drawVertexShader);

    // 初始化粒子数据
    const particlePositions = new Float32Array(NUM_PARTICLES * 2);
    const particleVelocities = new Float32Array(NUM_PARTICLES * 2);
    const particleSpawntime = new Float32Array(NUM_PARTICLES);
    const particleLifetime = new Float32Array(NUM_PARTICLES);
    const particleIDs = new Float32Array(NUM_PARTICLES);

    for (let p = 0; p < NUM_PARTICLES; ++p)
    {
        particlePositions[p * 2] = 0.0;
        particlePositions[p * 2 + 1] = 0.0;
        particleVelocities[p * 2] = 0.0;
        particleVelocities[p * 2 + 1] = 0.0;
        particleSpawntime[p] = 0.0;
        particleLifetime[p] = 0.0;
        particleIDs[p] = p;
    }

    // 初始化顶点数组和缓冲区（ping-pong 双缓冲）
    const vertexArrays: { vertices?: VertexAttributes }[][] = [];
    const transformFeedbacks: TransformFeedback[] = [];
    const vertexBuffers: VertexData[][] = [];

    for (let i = 0; i < 2; ++i)
    {
        vertexBuffers[i] = new Array(NUM_LOCATIONS);

        // 设置输入缓冲区
        vertexBuffers[i][POSITION_LOCATION] = particlePositions.slice();
        vertexBuffers[i][VELOCITY_LOCATION] = particleVelocities.slice();
        vertexBuffers[i][SPAWNTIME_LOCATION] = particleSpawntime.slice();
        vertexBuffers[i][LIFETIME_LOCATION] = particleLifetime.slice();
        vertexBuffers[i][ID_LOCATION] = particleIDs;

        vertexArrays[i] = [];

        // Transform Feedback 输入顶点数据（所有属性）
        vertexArrays[i][0] = {
            vertices: {
                a_position: { data: vertexBuffers[i][POSITION_LOCATION], format: 'float32x2' },
                a_velocity: { data: vertexBuffers[i][VELOCITY_LOCATION], format: 'float32x2' },
                a_spawntime: { data: vertexBuffers[i][SPAWNTIME_LOCATION], format: 'float32' },
                a_lifetime: { data: vertexBuffers[i][LIFETIME_LOCATION], format: 'float32' },
                a_ID: { data: vertexBuffers[i][ID_LOCATION], format: 'float32' },
            },
        };

        // 渲染输入顶点数据（仅位置）
        vertexArrays[i][1] = {
            vertices: {
                a_position: { data: vertexBuffers[i][POSITION_LOCATION], format: 'float32x2' },
            },
        };

        // Transform Feedback 输出配置（分离模式）
        transformFeedbacks[i] = {
            bindBuffers: [
                { index: 0, data: vertexBuffers[i][POSITION_LOCATION] },
                { index: 1, data: vertexBuffers[i][VELOCITY_LOCATION] },
                { index: 2, data: vertexBuffers[i][SPAWNTIME_LOCATION] },
                { index: 3, data: vertexBuffers[i][LIFETIME_LOCATION] },
            ],
        };
    }

    // Transform Feedback 管线
    const transformFeedbackPipeline: TransformFeedbackPipeline = {
        vertex: { glsl: vertexEmitGlsl, wgsl: computeEmitWgsl },
        transformFeedbackVaryings: {
            varyings: ['v_position', 'v_velocity', 'v_spawntime', 'v_lifetime'],
            bufferMode: 'SEPARATE_ATTRIBS',
        },
    };

    // 渲染管线
    const renderPipeline: RenderPipeline = {
        vertex: { glsl: vertexDrawGlsl, wgsl: vertexDrawWgsl },
        fragment: {
            glsl: fragmentDrawGlsl,
            wgsl: fragmentDrawWgsl,
            targets: [{
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one' },
                    alpha: { srcFactor: 'src-alpha', dstFactor: 'one' },
                },
            }],
        },
        primitive: { topology: 'point-list' },
    };

    // Transform Feedback 渲染对象
    const transformRO: TransformFeedbackObject = {
        pipeline: transformFeedbackPipeline,
        vertices: null,
        transformFeedback: null,
        uniforms: {
            u_acceleration: { value: [0.0, ACCELERATION] },
        },
        draw: { __type__: 'DrawVertex', vertexCount: NUM_PARTICLES },
    };

    // 渲染对象
    const renderRO: RenderObject = {
        pipeline: renderPipeline,
        bindingResources: {
            u_color: { value: [0.0, 1.0, 1.0, 1.0] },
        },
        draw: { __type__: 'DrawVertex', vertexCount: NUM_PARTICLES },
    };

    // 提交命令
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

    // 初始化 WebGL
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    initCanvasSize(webglCanvas);
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2', webGLContextAttributes: { antialias: false } });

    // 初始化 WebGPU
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    initCanvasSize(webgpuCanvas);
    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    // 粒子系统状态
    const appStartTime = Date.now();
    let currentSourceIdx = 0;

    // 更新粒子系统
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

        // 1秒后进行比较（等待粒子系统稳定）
        const elapsed = Date.now() - appStartTime;
        if (!comparisonDone && elapsed >= comparisonDelay)
        {
            comparisonDone = true;
            // 使用容差 0 来精确比较
            autoCompareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, 0).then((result) =>
            {
                // 添加不一致原因说明
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

    // 添加解释说明
    const explanation = document.createElement('div');
    explanation.style.cssText = 'margin-top: 12px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 13px; color: #856404;';

    if (!result.isMatch)
    {
        explanation.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px;">⚠️ 不一致原因：</div>
            <div style="margin-bottom: 8px;">
                WebGPU 不支持 <code>gl_PointSize</code> / <code>point_size</code> builtin，所有点都以 1 像素渲染，而 WebGL 支持设置点大小为 2 像素。
            </div>
            <div style="padding: 8px; background: #e7f3ff; border-radius: 4px; color: #0066cc;">
                💡 如需大于 1 像素的点，需要使用实例化渲染四边形或其他替代方案。
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

