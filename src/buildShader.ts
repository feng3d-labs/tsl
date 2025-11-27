let buildParam: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 };

export function buildShader(param: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 }, callback: () => string)
{
    const previousBuildParam = buildParam;

    buildParam = param;

    let result: string;

    try
    {
        result = callback();
    } catch (error)
    {
        result = '';
        console.error('Error in buildParam', error);
    }

    buildParam = previousBuildParam;

    return result;
}

export function getBuildParam()
{
    return buildParam;
}