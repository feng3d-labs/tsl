import { vertexShader, fragmentShader } from './shader';
import * as fs from 'fs';
import * as path from 'path';

// 生成 WGSL 文件
const vertexWGSL = vertexShader.toWGSL();
const fragmentWGSL = fragmentShader.toWGSL(vertexShader);

// 写入文件
const shaderDir = __dirname;

fs.writeFileSync(path.join(shaderDir, 'vertex.wgsl'), vertexWGSL);
fs.writeFileSync(path.join(shaderDir, 'fragment.wgsl'), fragmentWGSL);

console.log('Generated shader files:');
console.log('- vertex.wgsl');
console.log('- fragment.wgsl');
console.log('\n=== Vertex WGSL ===');
console.log(vertexWGSL);
console.log('\n=== Fragment WGSL ===');
console.log(fragmentWGSL);

