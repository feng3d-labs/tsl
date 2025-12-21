import { describe, expect, it } from 'vitest';
import { array, attribute, fragment, gl_FragColor, gl_InstanceID, gl_Position, int, mat4, precision, struct, uniform, varying, vec2, vec4, vertex } from '../src';

describe('Struct 着色器代码生成', () =>
{
    describe('GLSL UBO 生成', () =>
    {
        it('应该在顶点着色器中生成正确的 UBO 声明', () =>
        {
            const pos = vec2(attribute('pos', 0));

            const Transform = struct('Transform', {
                MVP: array(mat4, 2),
            });
            const transform = Transform(uniform('transform'));

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(transform.MVP.index(0).multiply(vec4(pos, 0.0, 1.0)));
            });

            const glsl = vertexShader.toGLSL(2);

            // 应该包含 UBO 声明
            expect(glsl).toContain('layout(std140, column_major) uniform;');
            expect(glsl).toContain('uniform Transform');
            expect(glsl).toContain('mat4 MVP[2];');
            expect(glsl).toContain('} transform;');
        });

        it('应该在片段着色器中生成正确的 UBO 声明', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4, 2),
            });
            const material = Material(uniform('material'));

            const instance = int(varying('instance', { interpolation: 'flat' }));

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            const glsl = fragmentShader.toGLSL(2);

            // 应该包含 UBO 声明
            expect(glsl).toContain('uniform Material');
            expect(glsl).toContain('vec4 Diffuse[2];');
            expect(glsl).toContain('} material;');
        });
    });

    describe('WGSL 结构体生成', () =>
    {
        it('应该在顶点着色器中生成正确的 WGSL 结构体', () =>
        {
            const pos = vec2(attribute('pos', 0));

            const Transform = struct('Transform', {
                MVP: array(mat4, 2),
            });
            const transform = Transform(uniform('transform'));

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(transform.MVP.index(0).multiply(vec4(pos, 0.0, 1.0)));
            });

            const wgsl = vertexShader.toWGSL();

            // 应该包含结构体定义
            expect(wgsl).toContain('struct Transform');
            expect(wgsl).toContain('MVP: array<mat4x4<f32>, 2>');
            // 应该包含 uniform 声明
            expect(wgsl).toContain('@group(0) @binding(0) var<uniform> transform: Transform;');
        });

        it('应该在片段着色器中生成正确的 WGSL 结构体', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4, 2),
            });
            const material = Material(uniform('material'));

            const instance = int(varying('instance', { interpolation: 'flat' }));

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            const wgsl = fragmentShader.toWGSL();

            // 应该包含结构体定义
            expect(wgsl).toContain('struct Material');
            expect(wgsl).toContain('Diffuse: array<vec4<f32>, 2>');
            // 应该包含 uniform 声明
            expect(wgsl).toMatch(/@group\(0\) @binding\(\d+\) var<uniform> material: Material;/);
        });
    });
});

describe('WebGL 2.0 gl_FragColor 处理', () =>
{
    it('应该在 WebGL 2.0 中将 gl_FragColor 替换为 color', () =>
    {
        const fragmentShader = fragment('main', () =>
        {
            gl_FragColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
        });

        const glsl = fragmentShader.toGLSL(2);

        // 应该声明 out 变量
        expect(glsl).toContain('layout(location = 0) out vec4 color;');
        // 应该使用 color 而不是 gl_FragColor
        expect(glsl).toContain('color = vec4(1.0, 0.0, 0.0, 1.0);');
        // 不应该包含 gl_FragColor
        expect(glsl).not.toContain('gl_FragColor');
    });

    it('应该在 WebGL 1.0 中保留 gl_FragColor', () =>
    {
        const fragmentShader = fragment('main', () =>
        {
            gl_FragColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
        });

        const glsl = fragmentShader.toGLSL(1);

        // WebGL 1.0 应该使用 gl_FragColor
        expect(glsl).toContain('gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
    });
});

describe('WGSL @interpolate(flat) 属性', () =>
{
    it('应该为整数类型 varying 添加 @interpolate(flat) 属性', () =>
    {
        const instance = int(varying('instance', { interpolation: 'flat' }));

        const vertexShader = vertex('main', () =>
        {
            instance.assign(int(gl_InstanceID));
            gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
        });

        const wgsl = vertexShader.toWGSL();

        // VaryingStruct 中应该包含 @interpolate(flat) 属性
        expect(wgsl).toContain('@location(0) @interpolate(flat) instance: i32');
    });

    it('应该在片段着色器中也包含 @interpolate(flat) 属性（通过 struct 使用时）', () =>
    {
        const Material = struct('Material', {
            Diffuse: array(vec4, 2),
        });
        const material = Material(uniform('material'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        // 顶点着色器需要先定义 varying
        const vertexShader = vertex('main', () =>
        {
            instance.assign(int(gl_InstanceID));
            gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
        });

        const fragmentShader = fragment('main', () =>
        {
            // 通过 struct 数组索引使用 varying，确保依赖链完整
            gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
        });

        // 先生成顶点着色器（分配 location）
        vertexShader.toWGSL();

        const wgsl = fragmentShader.toWGSL(vertexShader);

        // VaryingStruct 中应该包含 @interpolate(flat) 属性
        expect(wgsl).toContain('@location(0) @interpolate(flat) instance: i32');
    });
});

describe('Fragment shader 中 varying 访问路径', () =>
{
    it('应该在片段着色器中使用 v.xxx 格式访问 varying（通过 struct 使用时）', () =>
    {
        const Material = struct('Material', {
            Diffuse: array(vec4, 2),
        });
        const material = Material(uniform('material'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        // 顶点着色器需要先定义 varying
        const vertexShader = vertex('main', () =>
        {
            instance.assign(int(gl_InstanceID));
            gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
        });

        const fragmentShader = fragment('main', () =>
        {
            // 通过 struct 数组索引使用 varying，确保依赖链完整
            gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
        });

        // 先生成顶点着色器（分配 location）
        vertexShader.toWGSL();

        const wgsl = fragmentShader.toWGSL(vertexShader);

        // 函数参数应该包含 v: VaryingStruct
        expect(wgsl).toContain('v: VaryingStruct');
        // 访问 varying 应该使用 v.instance 格式
        expect(wgsl).toContain('v.instance');
    });

    it('应该在数组索引中正确使用 v.xxx 格式', () =>
    {
        const Material = struct('Material', {
            Diffuse: array(vec4, 2),
        });
        const material = Material(uniform('material'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        // 顶点着色器需要先定义 varying
        const vertexShader = vertex('main', () =>
        {
            instance.assign(int(gl_InstanceID));
            gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
        });

        const fragmentShader = fragment('main', () =>
        {
            gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
        });

        // 先生成顶点着色器（分配 location）
        vertexShader.toWGSL();

        const wgsl = fragmentShader.toWGSL(vertexShader);

        // 数组索引中应该使用 v.instance
        expect(wgsl).toContain('material.Diffuse[v.instance % 2]');
    });
});

describe('数组动态索引', () =>
{
    it('应该支持使用 gl_InstanceID 作为数组索引', () =>
    {
        const pos = vec2(attribute('pos', 0));

        const Transform = struct('Transform', {
            MVP: array(mat4, 2),
        });
        const transform = Transform(uniform('transform'));

        const vertexShader = vertex('main', () =>
        {
            gl_Position.assign(transform.MVP.index(gl_InstanceID).multiply(vec4(pos, 0.0, 1.0)));
        });

        const glsl = vertexShader.toGLSL(2);
        expect(glsl).toContain('transform.MVP[gl_InstanceID]');

        const wgsl = vertexShader.toWGSL();
        expect(wgsl).toContain('transform.MVP[instanceIndex]');
    });

    it('应该在索引计算中正确处理表达式', () =>
    {
        const Material = struct('Material', {
            Diffuse: array(vec4, 4),
        });
        const material = Material(uniform('material'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        const fragmentShader = fragment('main', () =>
        {
            // 使用 mod 运算的结果作为索引
            gl_FragColor.assign(material.Diffuse.index(instance.mod(4)));
        });

        const glsl = fragmentShader.toGLSL(2);
        expect(glsl).toContain('material.Diffuse[instance % 4]');

        const wgsl = fragmentShader.toWGSL();
        // 在 WGSL 中 instance 应该被替换为 v.instance
        expect(wgsl).toContain('material.Diffuse[v.instance % 4]');
    });
});

describe('完整的 draw_instanced_ubo 示例', () =>
{
    it('应该正确生成顶点着色器', () =>
    {
        const pos = vec2(attribute('pos', 0));

        const Transform = struct('Transform', {
            MVP: array(mat4, 2),
        });
        const transform = Transform(uniform('transform'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        const vertexShader = vertex('main', () =>
        {
            precision('highp', 'float');
            precision('highp', 'int');

            instance.assign(int(gl_InstanceID));
            gl_Position.assign(transform.MVP.index(gl_InstanceID).multiply(vec4(pos, 0.0, 1.0)));
        });

        // GLSL 验证
        const glsl = vertexShader.toGLSL(2);
        expect(glsl).toContain('#version 300 es');
        expect(glsl).toContain('uniform Transform');
        expect(glsl).toContain('mat4 MVP[2];');
        expect(glsl).toContain('flat out int instance;');

        // WGSL 验证
        const wgsl = vertexShader.toWGSL();
        expect(wgsl).toContain('struct Transform');
        expect(wgsl).toContain('MVP: array<mat4x4<f32>, 2>');
        expect(wgsl).toContain('@interpolate(flat) instance: i32');
    });

    it('应该正确生成片段着色器', () =>
    {
        const Material = struct('Material', {
            Diffuse: array(vec4, 2),
        });
        const material = Material(uniform('material'));

        const instance = int(varying('instance', { interpolation: 'flat' }));

        const fragmentShader = fragment('main', () =>
        {
            precision('highp', 'float');
            precision('highp', 'int');

            gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
        });

        // GLSL 验证
        const glsl = fragmentShader.toGLSL(2);
        expect(glsl).toContain('#version 300 es');
        expect(glsl).toContain('uniform Material');
        expect(glsl).toContain('vec4 Diffuse[2];');
        expect(glsl).toContain('flat in int instance;');
        expect(glsl).toContain('layout(location = 0) out vec4 color;');
        expect(glsl).toContain('color = material.Diffuse[instance % 2];');

        // WGSL 验证
        const wgsl = fragmentShader.toWGSL();
        expect(wgsl).toContain('struct Material');
        expect(wgsl).toContain('Diffuse: array<vec4<f32>, 2>');
        expect(wgsl).toContain('@interpolate(flat) instance: i32');
        expect(wgsl).toContain('v: VaryingStruct');
        expect(wgsl).toContain('material.Diffuse[v.instance % 2]');
    });
});
