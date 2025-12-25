#version 300 es
#define ALPHA 0.9

precision highp float;
precision highp int;

in vec3 v_color;

out vec4 color;

void main()
{
    color = vec4(v_color * ALPHA, ALPHA);
}

