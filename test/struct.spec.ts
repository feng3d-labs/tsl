// import { describe, expect, it } from 'vitest';
// import { Struct, struct } from '../src/struct';
// import { vec2 } from '../src/builtin/vec2';
// import { vec4 } from '../src/builtin/vec4';
// import { Attribute } from '../src/Attribute';
// import { Uniform } from '../src/Uniform';

// describe('Struct', () =>
// {
//     describe('Struct 类', () =>
//     {
//         it('应该能够创建 Struct 实例', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//                 color: vec4(1.0, 0.0, 0.0, 1.0),
//             };
//             const s = new Struct('VertexOutput', fields);
//             expect(s).toBeInstanceOf(Struct);
//             expect(s.name).toBe('VertexOutput');
//             expect(s.fields).toBe(fields);
//         });

//         it('应该正确生成 GLSL 代码', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//                 color: vec4(1.0, 0.0, 0.0, 1.0),
//             };
//             const s = new Struct('VertexOutput', fields);
//             const glsl = s.toGLSL();
//             expect(glsl).toContain('struct VertexOutput');
//             expect(glsl).toContain('position: vec4(1.0, 2.0, 3.0, 4.0)');
//             expect(glsl).toContain('color: vec4(1.0, 0.0, 0.0, 1.0)');
//         });

//         it('应该正确生成 WGSL 代码', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//                 color: vec4(1.0, 0.0, 0.0, 1.0),
//             };
//             const s = new Struct('VertexOutput', fields);
//             const wgsl = s.toWGSL();
//             expect(wgsl).toContain('struct VertexOutput');
//             expect(wgsl).toContain('position: vec4<f32>(1.0, 2.0, 3.0, 4.0)');
//             expect(wgsl).toContain('color: vec4<f32>(1.0, 0.0, 0.0, 1.0)');
//         });

//         it('应该正确收集依赖', () =>
//         {
//             const position = vec4(1.0, 2.0, 3.0, 4.0);
//             const color = vec4(1.0, 0.0, 0.0, 1.0);
//             const fields = { position, color };
//             const s = new Struct('VertexOutput', fields);
//             expect(s.dependencies).toHaveLength(2);
//             expect(s.dependencies).toContain(position);
//             expect(s.dependencies).toContain(color);
//         });

//         it('应该支持单个字段', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//             };
//             const s = new Struct('Position', fields);
//             const glsl = s.toGLSL();
//             expect(glsl).toBe('struct Position { position: vec4(1.0, 2.0, 3.0, 4.0) };');
//         });

//         it('应该支持多个字段', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//                 color: vec4(1.0, 0.0, 0.0, 1.0),
//                 normal: vec4(0.0, 0.0, 1.0, 0.0),
//             };
//             const s = new Struct('VertexOutput', fields);
//             const glsl = s.toGLSL();
//             expect(glsl).toContain('position: vec4(1.0, 2.0, 3.0, 4.0)');
//             expect(glsl).toContain('color: vec4(1.0, 0.0, 0.0, 1.0)');
//             expect(glsl).toContain('normal: vec4(0.0, 0.0, 1.0, 0.0)');
//         });

//         it('应该支持包含 uniform 的字段', () =>
//         {
//             const uniform = new Uniform('uColor', 0, 0);
//             const color = vec4(uniform);
//             const fields = {
//                 color,
//             };
//             const s = new Struct('Output', fields);
//             const glsl = s.toGLSL();
//             expect(glsl).toContain('color: uColor');
//         });

//         it('应该支持包含 attribute 的字段', () =>
//         {
//             const attribute = new Attribute('aPosition', 0);
//             const position = vec2(attribute);
//             const fields = {
//                 position,
//             };
//             const s = new Struct('Input', fields);
//             const glsl = s.toGLSL();
//             expect(glsl).toContain('position: aPosition');
//         });
//     });

//     describe('struct() 函数', () =>
//     {
//         it('应该能够创建 Struct 实例', () =>
//         {
//             const fields = {
//                 position: vec4(1.0, 2.0, 3.0, 4.0),
//                 color: vec4(1.0, 0.0, 0.0, 1.0),
//             };
//             const result = struct('VertexOutput', fields);
//             expect(result).toBeDefined();
//             expect(result.position).toBe(fields.position);
//             expect(result.color).toBe(fields.color);
//         });

//         it('应该返回具有相同字段的对象', () =>
//         {
//             const position = vec4(1.0, 2.0, 3.0, 4.0);
//             const color = vec4(1.0, 0.0, 0.0, 1.0);
//             const fields = { position, color };
//             const result = struct('VertexOutput', fields);
//             expect(result.position).toBe(position);
//             expect(result.color).toBe(color);
//         });

//         it('应该能够访问字段', () =>
//         {
//             const position = vec4(1.0, 2.0, 3.0, 4.0);
//             const color = vec4(1.0, 0.0, 0.0, 1.0);
//             const fields = { position, color };
//             const result = struct('VertexOutput', fields);
//             expect(result.position.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0)');
//             expect(result.color.toGLSL()).toBe('vec4(1.0, 0.0, 0.0, 1.0)');
//         });

//         it('应该支持类型推断', () =>
//         {
//             const position = vec4(1.0, 2.0, 3.0, 4.0);
//             const color = vec4(1.0, 0.0, 0.0, 1.0);
//             const fields = { position, color };
//             const result = struct('VertexOutput', fields);
//             // TypeScript 应该能够推断出 result.position 和 result.color 的类型
//             expect(result.position).toBeInstanceOf(Object);
//             expect(result.color).toBeInstanceOf(Object);
//         });
//     });
// });

