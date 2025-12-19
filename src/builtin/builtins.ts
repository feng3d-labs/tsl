import { builtin } from './builtin';
import { vec4 } from './types/vec4';

export const gl_Position = vec4(builtin('gl_Position'));
export const gl_FragColor = vec4(builtin('gl_FragColor'));