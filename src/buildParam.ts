let buildParam: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 };

export function setBuildParam(param: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 })
{
    buildParam = param;
}

export function getBuildParam()
{
    return buildParam;
}