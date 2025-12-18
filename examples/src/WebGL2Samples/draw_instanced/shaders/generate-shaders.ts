import { vertexShader, fragmentShader } from './shader';
import * as fs from 'fs';
import * as path from 'path';

// 生成GLSL和WGS着色器
const vertexGlsl = vertexShader.toGLSL(2);
const fragmentGlsl = fragmentShader.toGLSL(2);
const vertexWgsl = vertexShader.toWGSL();
const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

// 保存到文件
const shaderDir = path.dirname(__filename);
fs.writeFileSync(path.join(shaderDir, 'vertex.glsl'), vertexGlsl);
fs.writeFileSync(path.join(shaderDir, 'fragment.glsl'), fragmentGlsl);
fs.writeFileSync(path.join(shaderDir, 'vertex.wgsl'), vertexWgsl);
fs.writeFileSync(path.join(shaderDir, 'fragment.wgsl'), fragmentWgsl);

console.log('Shaders generated successfully!');
