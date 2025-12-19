import { builtin } from './builtin';
import { bool } from './types/bool';
import { uint } from './types/uint';
import { vec2 } from './types/vec2';
import { vec4 } from './types/vec4';

export const gl_Position = vec4(builtin('gl_Position', 'position'));
export const gl_FragColor = vec4(builtin('gl_FragColor', 'fragColor'));
export const gl_VertexID = uint(builtin('gl_VertexID', 'vertexIndex'));
export const gl_FragCoord = vec2(builtin('gl_FragCoord', 'fragCoord'));
export const gl_InstanceID = uint(builtin('gl_InstanceID', 'instanceIndex'));
export const gl_FrontFacing = bool(builtin('gl_FrontFacing', 'frontFacing'));