/**
 * 格式化数字为 GLSL/WGSL 格式
 * 所有整数（正数和负数）都保留 .0 后缀以表示浮点数
 */
export function formatNumber(num: number): string
{
    // 如果是整数（正数或负数），添加 .0 后缀
    if (Number.isInteger(num))
    {
        return `${num}.0`;
    }

    // 浮点数直接转换为字符串
    return String(num);
}

