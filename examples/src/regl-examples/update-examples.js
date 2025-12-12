const fs = require('fs');
const path = require('path');

// 示例配置信息
const examples = [
    {
        name: 'basic',
        title: '基础示例',
        description: 'TSL 基础示例，展示最基本的着色器编写和渲染流程。',
        framework: 'feng3d'
    },
    {
        name: 'batch',
        title: '批量渲染示例',
        description: '使用 TSL 实现的批量渲染示例，展示如何高效渲染多个对象。',
        framework: 'feng3d'
    },
    {
        name: 'bunny',
        title: '兔子模型示例',
        description: '渲染兔子模型的示例，展示 3D 模型加载和渲染。',
        framework: 'feng3d'
    },
    {
        name: 'camera',
        title: '相机控制示例',
        description: '展示相机控制和视角变换的示例，支持鼠标交互。',
        framework: 'feng3d'
    },
    {
        name: 'cloth',
        title: '布料模拟示例',
        description: '使用 TSL 实现的实时布料物理模拟，展示 WebGL 和 WebGPU 渲染结果对比。',
        framework: 'feng3d'
    },
    {
        name: 'cube',
        title: '立方体示例',
        description: '渲染立方体的基础示例，展示纹理映射和光照效果。',
        framework: 'feng3d'
    }
];

// 读取模板文件
const templatePath = path.join(__dirname, 'template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// 遍历所有示例，更新 HTML 文件
examples.forEach(example => {
    const examplePath = path.join(__dirname, example.name);
    const htmlPath = path.join(examplePath, 'index.html');
    
    // 替换模板中的变量
    let htmlContent = template
        .replace(/{{EXAMPLE_NAME}}/g, example.name)
        .replace(/{{EXAMPLE_TITLE}}/g, example.title)
        .replace(/{{EXAMPLE_DESCRIPTION}}/g, example.description)
        .replace(/{{FRAMEWORK_NAME}}/g, example.framework);
    
    // 写入新的 HTML 文件
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`Updated HTML for example: ${example.name}`);
});

console.log('All examples updated successfully!');