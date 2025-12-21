import { attribute, fragment, gl_InstanceID, gl_Position, int, Mat4ArrayMember, precision, return_, uniformBlock, varying, vec2, vec4, Vec4ArrayMember, vertex } from '@feng3d/tsl';

// 输入属性
const pos = vec2(attribute('pos', 0));

// 定义 Transform UBO（包含 MVP 矩阵数组）
const Transform = uniformBlock({
    blockName: 'Transform',
    instanceName: 'transform',
    members: [
        { name: 'MVP', type: 'mat4', length: 2 }
    ]
});

// 定义 Material UBO（包含颜色数组）
const Material = uniformBlock({
    blockName: 'Material',
    instanceName: 'material',
    members: [
        { name: 'Diffuse', type: 'vec4', length: 2 }
    ]
});

// varying 变量 - flat 插值（与原示例一致使用 instance 命名）
const instance = int(varying('instance', { interpolation: 'flat' }));

// 顶点着色器
export const vertexShader = vertex('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 传递实例 ID 到片段着色器
    instance.assign(int(gl_InstanceID));

    // 根据实例 ID 索引对应的 MVP 矩阵（使用类型断言）
    const mvp = (Transform.MVP as Mat4ArrayMember).index(gl_InstanceID);

    // 计算位置
    gl_Position.assign(mvp.multiply(vec4(pos, 0.0, 1.0)));
});

// 片段着色器
export const fragmentShader = fragment('main', () =>
{
    precision('highp', 'float');
    precision('highp', 'int');

    // 根据实例 ID 索引对应的颜色（使用类型断言）
    const color = (Material.Diffuse as Vec4ArrayMember).index(instance);

    return_(color);
});

// 导出 UBO 定义，供 index.ts 使用
export { Transform, Material };
