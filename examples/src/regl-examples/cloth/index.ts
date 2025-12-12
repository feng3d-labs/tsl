import { Buffer, RenderObject, Submit } from '@feng3d/render-api';
import { SamplerTexture, WebGL } from '@feng3d/webgl';
import { reactive } from '@feng3d/reactivity';
import { vertexShader, fragmentShader } from './shaders/shader';

// 导入依赖的数学库
import * as mat4 from '../../utils/gl-mat4';
import * as vec3 from '../../utils/gl-vec3';

// 创建一个约束类，连接两个顶点
class Constraint {
    i0: number;
    i1: number;
    restLength: number;
    
    constructor(i0: number, i1: number, position: number[][]) {
        this.i0 = i0;
        this.i1 = i1;
        this.restLength = vec3.distance(position[i0], position[i1]);
    }
}

// 初始化函数
async function init() {
    // 获取 canvas 元素
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // 初始化 WebGL 和 WebGPU
    const webgl = new WebGL({ canvasId: 'webgl', webGLcontextId: 'webgl2' });
    
    // 创建布料的几何数据
    const uv: number[][] = [];
    const elements: number[][] = [];
    const position: number[][] = [];
    const oldPosition: number[][] = [];
    const normal: number[][] = [];
    const constraints: Constraint[] = [];
    
    // 布料的大小和细分程度
    const size = 5.5;
    const xmin = -size;
    const xmax = size;
    const ymin = -size;
    const ymax = size;
    const N = 20;
    
    // 创建布料的顶点和UV
    for (let row = 0; row <= N; ++row) {
        const z = (row / N) * (ymax - ymin) + ymin;
        const v = row / N;
        
        for (let col = 0; col <= N; ++col) {
            const x = (col / N) * (xmax - xmin) + xmin;
            const u = col / N;
            
            position.push([x, 0.0, z]);
            oldPosition.push([x, 0.0, z]);
            uv.push([u, v]);
        }
    }
    
    // 创建法线数组
    for (let i = 0; i < position.length; ++i) {
        normal.push([0.0, 0.0, 0.0]);
    }
    
    // 创建三角形面
    for (let row = 0; row <= (N - 1); ++row) {
        for (let col = 0; col <= (N - 1); ++col) {
            const i = row * (N + 1) + col;
            
            const i0 = i + 0;
            const i1 = i + 1;
            const i2 = i + (N + 1) + 0;
            const i3 = i + (N + 1) + 1;
            
            elements.push([i3, i1, i0]);
            elements.push([i0, i2, i3]);
        }
    }
    
    // 创建约束
    for (let row = 0; row <= N; ++row) {
        for (let col = 0; col <= N; ++col) {
            const i = row * (N + 1) + col;
            
            const i0 = i + 0;
            const i1 = i + 1;
            const i2 = i + (N + 1) + 0;
            const i3 = i + (N + 1) + 1;
            
            // 水平约束
            if (col < N) {
                constraints.push(new Constraint(i0, i1, position));
            }
            
            // 垂直约束
            if (row < N) {
                constraints.push(new Constraint(i0, i2, position));
            }
            
            // 对角线约束
            if (col < N && row < N) {
                constraints.push(new Constraint(i0, i3, position));
            }
        }
    }
    
    // 扁平化数组
    const positions = position.reduce((pv: number[], cv: number[]) => {
        cv.forEach((v) => { pv.push(v); });
        return pv;
    }, []);
    
    const uvs = uv.reduce((pv: number[], cv: number[]) => {
        cv.forEach((v) => { pv.push(v); });
        return pv;
    }, []);
    
    const normals = normal.reduce((pv: number[], cv: number[]) => {
        cv.forEach((v) => { pv.push(v); });
        return pv;
    }, []);
    
    const indices = elements.reduce((pv: number[], cv: number[]) => {
        cv.forEach((v) => { pv.push(v); });
        return pv;
    }, []);
    
    // 使用 TSL 生成着色器代码
    const vertexGlsl = vertexShader.toGLSL();
    const fragmentGlsl = fragmentShader.toGLSL();
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL();
    
    // 创建渲染对象
    const renderObject: RenderObject = {
        vertices: {
            position: {
                data: new Float32Array(positions),
                format: 'float32x3' as const,
            },
            normal: {
                data: new Float32Array(normals),
                format: 'float32x3' as const,
            },
            uv: {
                data: new Float32Array(uvs),
                format: 'float32x2' as const,
            },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed' as const, indexCount: indices.length },
        bindingResources: {},
        pipeline: {
            vertex: {
                glsl: vertexGlsl,
                wgsl: vertexWgsl,
            },
            fragment: {
                glsl: fragmentGlsl,
                wgsl: fragmentWgsl,
                targets: [{ blend: {} }],
            },
            depthStencil: {},
        },
    };
    
    // 创建 submit 对象
    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: { 
                        colorAttachments: [{ clearValue: [0, 0, 0, 1] }],
                        depthStencilAttachment: { depthClearValue: 1 },
                    },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };
    
    let tick = 0;
    
    // 渲染循环
    function draw() {
        const deltaTime = 0.017;
        
        // 更新画布尺寸
        webglCanvas.width = webglCanvas.clientWidth * devicePixelRatio;
        webgpuCanvas.width = webgpuCanvas.clientWidth * devicePixelRatio;
        webglCanvas.height = webglCanvas.clientHeight * devicePixelRatio;
        webgpuCanvas.height = webgpuCanvas.clientHeight * devicePixelRatio;
        
        // 物理模拟
        const vel: number[] = [];
        const next: number[] = [];
        const delta = deltaTime;
        
        const g = [0.0, -4.0, 0.0]; // 重力向量
        
        // 风力
        const windForce = [Math.sin(tick / 2.0), Math.cos(tick / 3.0), Math.sin(tick / 1.0)];
        vec3.normalize(windForce, windForce);
        vec3.scale(windForce, windForce, 20.6);
        
        // 对每个顶点进行 Verlet 积分
        for (let i = 0; i < position.length; ++i) {
            // 计算速度
            vec3.subtract(vel, position[i], oldPosition[i]);
            next[0] = position[i][0];
            next[1] = position[i][1];
            next[2] = position[i][2];
            
            // 使用速度更新位置
            vec3.add(next, next, vel);
            
            // 应用重力
            vec3.scaleAndAdd(next, next, g, delta * delta);
            
            // 应用风力
            vec3.scaleAndAdd(next, next, windForce, delta * delta);
            
            // 更新旧位置和新位置
            oldPosition[i][0] = position[i][0];
            oldPosition[i][1] = position[i][1];
            oldPosition[i][2] = position[i][2];
            
            position[i][0] = next[0];
            position[i][1] = next[1];
            position[i][2] = next[2];
        }
        
        // 满足约束条件
        const d = [];
        for (let i = 0; i < 15; ++i) {
            for (let j = 0; j < constraints.length; j++) {
                const c = constraints[j];
                const v0 = position[c.i0];
                const v1 = position[c.i1];
                
                vec3.subtract(d, v1, v0);
                const dLength = vec3.length(d);
                const diff = (dLength - c.restLength) / dLength;
                
                // 调整顶点位置以满足约束
                vec3.scaleAndAdd(v0, v0, d, +0.5 * diff);
                vec3.scaleAndAdd(v1, v1, d, -0.5 * diff);
            }
        }
        
        // 固定布料的顶部边缘
        for (let i = 0; i <= N; ++i) {
            position[i][0] = oldPosition[i][0];
            position[i][1] = oldPosition[i][1];
            position[i][2] = oldPosition[i][2];
        }
        
        // 重新计算法线
        for (let i = 0; i < normal.length; i++) {
            normal[i][0] = 0.0;
            normal[i][1] = 0.0;
            normal[i][2] = 0.0;
        }
        
        // 计算每个面的法线并累加到顶点
        for (let i = 0; i < elements.length; i++) {
            const i0 = elements[i][0];
            const i1 = elements[i][1];
            const i2 = elements[i][2];
            
            const p0 = position[i0];
            const p1 = position[i1];
            const p2 = position[i2];
            
            const v0 = [0.0, 0.0, 0.0];
            vec3.subtract(v0, p0, p1);
            
            const v1 = [0.0, 0.0, 0.0];
            vec3.subtract(v1, p0, p2);
            
            // 计算面法线
            const n0 = [0.0, 0.0, 0.0];
            vec3.cross(n0, v0, v1);
            vec3.normalize(n0, n0);
            
            // 将面法线添加到顶点法线
            vec3.add(normal[i0], normal[i0], n0);
            vec3.add(normal[i1], normal[i1], n0);
            vec3.add(normal[i2], normal[i2], n0);
        }
        
        // 归一化顶点法线
        for (let i = 0; i < normal.length; i++) {
            vec3.normalize(normal[i], normal[i]);
        }
        
        // 更新缓冲区数据
        const updatedPositions = position.reduce((pv: number[], cv: number[]) => {
            cv.forEach((v) => { pv.push(v); });
            return pv;
        }, []);
        
        const updatedNormals = normal.reduce((pv: number[], cv: number[]) => {
            cv.forEach((v) => { pv.push(v); });
            return pv;
        }, []);
        
        // 更新顶点缓冲区
        reactive(Buffer.getBuffer(renderObject.vertices.position.data.buffer)).writeBuffers = [{ 
            data: new Float32Array(updatedPositions) 
        }];
        
        reactive(Buffer.getBuffer(renderObject.vertices.normal.data.buffer)).writeBuffers = [{ 
            data: new Float32Array(updatedNormals) 
        }];
        
        tick++;
        
        // 更新相机矩阵
        const viewportWidth = webglCanvas.width;
        const viewportHeight = webglCanvas.height;
        
        reactive(renderObject.bindingResources).view = { 
            value: mat4.lookAt([], [0, 3.0, 30.0], [0, 0, -5.5], [0, 1, 0]) 
        };
        
        reactive(renderObject.bindingResources).projection = {
            value: mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                1000),
        };
        
        // 提交渲染命令
        webgl.submit(submit);
        
        // 请求下一帧
        requestAnimationFrame(draw);
    }
    
    // 加载纹理
    const img = new Image();
    img.src = '../../../../assets/cloth.png';
    await img.decode();
    
    // 创建纹理对象
    const diffuse: SamplerTexture = {
        texture: {
            descriptor: {
                size: [img.width, img.height],
                generateMipmap: true,
            },
            sources: [{ image: img }],
        }, 
        sampler: { 
            minFilter: 'linear', 
            mipmapFilter: 'linear', 
            addressModeU: 'repeat', 
            addressModeV: 'repeat' 
        },
    };
    
    // 将纹理添加到渲染对象的绑定资源中
    reactive(renderObject.bindingResources).texture = diffuse;
    
    // 开始渲染循环
    draw();
}

// 监听 DOM 加载完成事件
document.addEventListener('DOMContentLoaded', init);
