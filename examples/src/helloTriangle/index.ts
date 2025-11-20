import { WebGL } from "@feng3d/webgl";
import { WebGPU } from "@feng3d/webgpu";
import { runWebGL } from "./runWebGL";
import { runWebGPU } from "./runWebGPU";

document.addEventListener('DOMContentLoaded', async () =>
{
    //
    const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
    const webgpu = await new WebGPU().init(); // 初始化WebGPU
    runWebGPU(webgpu, webgpuCanvas);

    //
    const webglCanvas = document.getElementById('webgl') as HTMLCanvasElement;
    const webgl = new WebGL({ canvasId: webglCanvas, webGLcontextId: 'webgl2' }); // 初始化WebGL
    runWebGL(webgl, webglCanvas);
});
