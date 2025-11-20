import { webgl } from "./webgl";
import { webgpu } from "./webgpu";

webgpu(document.getElementById('webgpu') as HTMLCanvasElement);
webgl(document.getElementById('webgl') as HTMLCanvasElement);
