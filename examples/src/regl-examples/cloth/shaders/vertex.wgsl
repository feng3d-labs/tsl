struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUv: vec2<f32>,
    @location(1) vNormal: vec3<f32>
};

@binding(0) @group(0) var<uniform> projection: mat4x4<f32>;
@binding(1) @group(0) var<uniform> view: mat4x4<f32>;

@vertex
fn main(
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>
) -> VertexOutput {
    var output: VertexOutput;
    output.vUv = uv;
    output.vNormal = normal;
    output.position = projection * view * vec4<f32>(position, 1.0);
    return output;
}