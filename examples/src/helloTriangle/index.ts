import { runWebGL } from "./runWebGL";
import { runWebGPU } from "./runWebGPU";

runWebGPU(document.getElementById('webgpu') as HTMLCanvasElement);

runWebGL(document.getElementById('webgl') as HTMLCanvasElement);
