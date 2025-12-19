import { builtin } from './builtin';
import { bool } from './types/bool';
import { uint } from './types/uint';
import { vec2 } from './types/vec2';
import { vec4 } from './types/vec4';

export const gl_Position = vec4(builtin('gl_Position'));
export const gl_FragColor = vec4(builtin('gl_FragColor'));
export const gl_VertexID = uint(builtin('gl_VertexID'));
export const gl_FragCoord = vec2(builtin('gl_FragCoord'));
export const gl_InstanceID = uint(builtin('gl_InstanceID'));
export const gl_FrontFacing = bool(builtin('gl_FrontFacing'));