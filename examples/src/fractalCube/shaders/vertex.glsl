attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
varying vec2 vTextureCoord;
varying vec4 vFragPosition;

void main() {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * position;
    vTextureCoord = aTextureCoord;
    vec4 fragPos = 0.5 * (vec4(aVertexPosition, 1.0) + vec4(1.0));
    vFragPosition = fragPos;
}