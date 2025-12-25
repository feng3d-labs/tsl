#version 300 es
#define POSITION_LOCATION 0

precision highp float;
precision highp int;
precision highp sampler3D;

layout(location = POSITION_LOCATION) in vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 2.0;
}

