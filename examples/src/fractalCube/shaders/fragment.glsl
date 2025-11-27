precision highp float;
varying vec2 vTextureCoord; varying vec4 vFragPosition;
uniform sampler2D uSampler;

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord) * vFragPosition;
    gl_FragColor = color; return;
}