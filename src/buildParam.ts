let buildParam: { shaderType: 'glsl' | 'wgsl', type: 'vertex' | 'fragment', version?: 1 | 2 };

export function setBuildParam(param: { shaderType: 'glsl' | 'wgsl', type: 'vertex' | 'fragment', version?: 1 | 2 })
{
    buildParam = param;
}

export function getBuildParam()
{
    return buildParam;
}