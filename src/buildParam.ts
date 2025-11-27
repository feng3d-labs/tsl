let buildParam: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 };

const buildParamStack: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 }[] = [];

export function setBuildParam(param: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 })
{
    buildParam = param;
    buildParamStack.push(param);
}

export function getBuildParam()
{
    return buildParam;
}

export function clearBuildParam()
{
    buildParamStack.pop();
    buildParam = buildParamStack[buildParamStack.length - 1];
}