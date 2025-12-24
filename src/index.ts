// 只导出 array 函数
export { array } from './array';

// 导出函数
export { attribute } from './attribute';
export { fragment } from './fragment';
export { precision } from './precision';
export { sampler2D } from './sampler2D';
export { sampler2DArray } from './sampler2DArray';
export { sampler3D } from './sampler3D';
export { usampler2D } from './usampler2D';
export { depthSampler } from './depthSampler';
export { struct } from './struct';
export { uniform } from './uniform';
export { varying } from './varying';
export { vertex } from './vertex';

// 导出内置变量
export { gl_Position, gl_FragColor, gl_VertexID, gl_FragCoord, gl_InstanceID, gl_FrontFacing } from './builtin/builtins';

// 导出 builtin 函数
export { acos } from './builtin/acos';
export { atan } from './builtin/atan';
export { clamp } from './builtin/clamp';
export { cross } from './builtin/cross';
export { dFdx } from './builtin/dFdx';
export { dFdy } from './builtin/dFdy';
export { fragColor } from './builtin/fragColor';
export { cos } from './builtin/cos';
export { dot } from './builtin/dot';
export { exp } from './builtin/exp';
export { fract } from './builtin/fract';
export { if_ } from './builtin/if_';
export { let_ } from './builtin/let';
export { max } from './builtin/max';
export { mix } from './builtin/mix';
export { normalize } from './builtin/normalize';
export { pow } from './builtin/pow';
export { reflect } from './builtin/reflect';
export { return_ } from './builtin/return';
export { select } from './builtin/select';
export { sin } from './builtin/sin';
export { smoothstep } from './builtin/smoothstep';
export { sqrt } from './builtin/sqrt';
export { step } from './builtin/step';
export { texelFetch } from './builtin/texelFetch';
export { texture } from './builtin/texture';
export { texture2D } from './builtin/texture2D';
export { textureGrad } from './builtin/textureGrad';
export { textureSize } from './builtin/textureSize';
export { var_ } from './builtin/var';

// 导出向量构造函数
export { bool } from './builtin/types/bool';
export { float } from './builtin/types/float';
export { int } from './builtin/types/int';
export { ivec2 } from './builtin/types/ivec2';
export { ivec3 } from './builtin/types/ivec3';
export { ivec4 } from './builtin/types/ivec4';
export { mat4 } from './builtin/types/mat4';
export { mat4x3 } from './builtin/types/mat4x3';
export { uint } from './builtin/types/uint';
export { uvec2 } from './builtin/types/uvec2';
export { uvec3 } from './builtin/types/uvec3';
export { uvec4 } from './builtin/types/uvec4';
export { vec2 } from './builtin/types/vec2';
export { vec3 } from './builtin/types/vec3';
export { vec4 } from './builtin/types/vec4';
