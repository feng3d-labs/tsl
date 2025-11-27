let buildParam: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 };

export function buildShader<T>(param: { language: 'glsl' | 'wgsl', stage: 'vertex' | 'fragment', version: 1 | 2 }, callback: () => T): T
{
    const previousBuildParam = buildParam;

    buildParam = param;

    let result: T;

    try
    {
        result = callback();
    } catch (error)
    {
        result = undefined as unknown as T;
        console.error('Error in buildParam', error);
    }

    buildParam = previousBuildParam;

    return result;
}

export function getBuildParam()
{
    return buildParam;
}