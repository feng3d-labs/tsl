/**
 * 第一帧画面比较工具
 * 用于比较 WebGL 和 WebGPU 的渲染结果是否一致
 */

import { CanvasTexture, ReadPixels, TextureView } from '@feng3d/render-api';
import { WebGL } from '@feng3d/webgl';
import { WebGPU } from '@feng3d/webgpu';

interface ComparisonResult
{
    isMatch: boolean;
    difference: number; // 0-1，0 表示完全一致，1 表示完全不同
    pixelDifference: number; // 不同的像素数量
    totalPixels: number; // 总像素数
    webglImageData?: ImageData;
    webgpuImageData?: ImageData;
    diffImageData?: ImageData; // 差异图像数据
}

/**
 * 自动比较并显示结果（便捷函数）
 */
export async function autoCompareFirstFrame(
    webgl: WebGL,
    webgpu: WebGPU,
    webglCanvas: HTMLCanvasElement,
    webgpuCanvas: HTMLCanvasElement,
    tolerance = 0,
    containerId = 'comparison-result',
): Promise<ComparisonResult>
{
    const result = await compareFirstFrame(webgl, webgpu, webglCanvas, webgpuCanvas, tolerance);
    displayComparisonResult(result, containerId);
    return result;
}

/**
 * 比较 WebGL 和 WebGPU 的第一帧画面
 */
async function compareFirstFrame(
    webgl: WebGL,
    webgpu: WebGPU,
    webglCanvas: HTMLCanvasElement,
    webgpuCanvas: HTMLCanvasElement,
    tolerance = 0,
): Promise<ComparisonResult>
{
    // 等待一帧，确保渲染完成
    // await new Promise(resolve => requestAnimationFrame(resolve));
    // await new Promise(resolve => setTimeout(resolve, 100)); // 额外等待 100ms 确保渲染完成

    const webglPixels = readWebGLPixels(webgl, webglCanvas);
    const webgpuPixels = await readWebGPUPixels(webgpu, webgpuCanvas);

    if (!webglPixels || !webgpuPixels)
    {
        return {
            isMatch: false,
            difference: 1,
            pixelDifference: 0,
            totalPixels: 0,
        };
    }

    return compareImageData(webglPixels, webgpuPixels, tolerance);
}

/**
 * 在页面上显示比较结果
 */
function displayComparisonResult(result: ComparisonResult, containerId = 'comparison-result')
{
    let container = document.getElementById(containerId);
    if (!container)
    {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            z-index: 10000;
            max-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            line-height: 1.4;
        `;
        document.body.appendChild(container);
    }

    const statusColor = result.isMatch ? '#4caf50' : '#f44336';
    const statusText = result.isMatch ? '✓ 一致' : '✗ 不一致';

    container.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: ${statusColor}; font-size: 14px;">
            ${statusText}
        </div>
        <div style="margin-bottom: 4px; font-size: 11px; white-space: nowrap;">
            差异像素: ${result.pixelDifference} / ${result.totalPixels}
        </div>
        <div style="margin-bottom: ${result.diffImageData ? '8px' : '0'}; font-size: 11px;">
            差异比例: ${(result.difference * 100).toFixed(2)}%
        </div>
        ${result.diffImageData ? `
            <div style="margin-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 8px;">
                <div style="margin-bottom: 4px; font-size: 10px; color: rgba(255, 255, 255, 0.8);">差异图像（红色=差异，灰色=相同）:</div>
                <canvas id="diff-canvas" style="border: 1px solid #666; max-width: 100%; max-height: 200px; display: block; width: auto; height: auto;"></canvas>
            </div>
        ` : ''}
    `;

    // 显示差异图像
    if (result.diffImageData)
    {
        const diffCanvas = document.getElementById('diff-canvas') as HTMLCanvasElement;
        if (diffCanvas)
        {
            // 计算缩放比例，确保图像不会太大
            const maxDisplayWidth = 260; // 容器最大宽度减去 padding
            const maxDisplayHeight = 200;
            const scale = Math.min(
                maxDisplayWidth / result.diffImageData.width,
                maxDisplayHeight / result.diffImageData.height,
                1, // 不放大
            );

            diffCanvas.width = result.diffImageData.width;
            diffCanvas.height = result.diffImageData.height;
            diffCanvas.style.width = `${result.diffImageData.width * scale}px`;
            diffCanvas.style.height = `${result.diffImageData.height * scale}px`;

            const ctx = diffCanvas.getContext('2d');
            if (ctx)
            {
                ctx.putImageData(result.diffImageData, 0, 0);
            }
        }
    }
}

/**
 * 从 WebGL canvas 读取像素数据
 */
function readWebGLPixels(webgl: WebGL, canvas: HTMLCanvasElement): ImageData | null
{
    try
    {
        const canvasTexture: CanvasTexture = {
            context: {
                canvasId: canvas.id,
                webGLcontextId: 'webgl2',
            },
        };

        const readPixelsParams: ReadPixels = {
            texture: canvasTexture,
            origin: [0, 0],
            copySize: [canvas.width, canvas.height],
        };

        const result = webgl.readPixels(readPixelsParams);
        const pixels = new Uint8Array(result.buffer, result.byteOffset, canvas.width * canvas.height * 4);

        // readPixels 读取的是从下到上的，需要翻转
        const flippedPixels = new Uint8Array(pixels.length);
        for (let y = 0; y < canvas.height; y++)
        {
            const srcRow = y * canvas.width * 4;
            const dstRow = (canvas.height - 1 - y) * canvas.width * 4;
            flippedPixels.set(pixels.subarray(srcRow, srcRow + canvas.width * 4), dstRow);
        }

        return new ImageData(
            new Uint8ClampedArray(flippedPixels),
            canvas.width,
            canvas.height,
        );
    } catch (e)
    {
        console.error('读取 WebGL canvas 像素失败:', e);
        return null;
    }
}

/**
 * 从 WebGPU canvas 读取像素数据
 */
async function readWebGPUPixels(webgpu: WebGPU, canvas: HTMLCanvasElement): Promise<ImageData | null>
{
    try
    {
        const canvasTexture: CanvasTexture = {
            context: {
                canvasId: canvas.id,
            },
        };

        const readPixelsParams: ReadPixels = {
            // texture: canvasTexture,
            origin: [0, 0],
            copySize: [canvas.width, canvas.height],
        };

        const result = await webgpu.readPixels(readPixelsParams);
        const pixels = new Uint8Array(result.buffer, result.byteOffset, canvas.width * canvas.height * 4);

        // 根据纹理格式处理颜色通道顺序
        const format = readPixelsParams.format;
        if (format === 'bgra8unorm' || format === 'bgra8unorm-srgb')
        {
            // BGRA 格式：需要将 BGRA 转换为 RGBA：交换 B 和 R 通道
            const rgbaPixels = new Uint8Array(pixels.length);
            for (let i = 0; i < pixels.length; i += 4)
            {
                rgbaPixels[i] = pixels[i + 2]; // R
                rgbaPixels[i + 1] = pixels[i + 1]; // G
                rgbaPixels[i + 2] = pixels[i]; // B
                rgbaPixels[i + 3] = pixels[i + 3]; // A
            }

            return new ImageData(
                new Uint8ClampedArray(rgbaPixels),
                canvas.width,
                canvas.height,
            );
        }
        else
        {
            // RGBA 格式：直接使用
            return new ImageData(
                new Uint8ClampedArray(pixels),
                canvas.width,
                canvas.height,
            );
        }
    } catch (e)
    {
        console.error('读取 WebGPU canvas 像素失败:', e);
        return null;
    }
}

/**
 * 比较两个 ImageData 是否一致
 */
function compareImageData(
    img1: ImageData,
    img2: ImageData,
    tolerance = 0, // 允许的像素差异容差（0-255）
): ComparisonResult
{
    if (img1.width !== img2.width || img1.height !== img2.height)
    {
        return {
            isMatch: false,
            difference: 1,
            pixelDifference: Math.max(img1.width * img1.height, img2.width * img2.height),
            totalPixels: Math.max(img1.width * img1.height, img2.width * img2.height),
        };
    }

    const width = img1.width;
    const height = img1.height;
    const totalPixels = width * height;
    let differentPixels = 0;
    const diffData = new Uint8ClampedArray(img1.data.length);

    for (let i = 0; i < img1.data.length; i += 4)
    {
        const r1 = img1.data[i];
        const g1 = img1.data[i + 1];
        const b1 = img1.data[i + 2];
        const a1 = img1.data[i + 3];

        const r2 = img2.data[i];
        const g2 = img2.data[i + 1];
        const b2 = img2.data[i + 2];
        const a2 = img2.data[i + 3];

        const rDiff = Math.abs(r1 - r2);
        const gDiff = Math.abs(g1 - g2);
        const bDiff = Math.abs(b1 - b2);
        const aDiff = Math.abs(a1 - a2);

        const isDifferent = rDiff > tolerance || gDiff > tolerance || bDiff > tolerance || aDiff > tolerance;

        if (isDifferent)
        {
            differentPixels++;
            // 生成差异图像（红色高亮差异）
            diffData[i] = 255; // R
            diffData[i + 1] = 0; // G
            diffData[i + 2] = 0; // B
            diffData[i + 3] = 255; // A
        }
        else
        {
            // 相同区域显示为灰色
            const gray = (r1 + g1 + b1) / 3;
            diffData[i] = gray;
            diffData[i + 1] = gray;
            diffData[i + 2] = gray;
            diffData[i + 3] = 255;
        }
    }

    const difference = differentPixels / totalPixels;
    const diffImageData = new ImageData(diffData, width, height);

    return {
        isMatch: differentPixels === 0,
        difference,
        pixelDifference: differentPixels,
        totalPixels,
        webglImageData: img1,
        webgpuImageData: img2,
        diffImageData,
    };
}
