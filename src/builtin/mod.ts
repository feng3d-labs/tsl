import { Float } from './types/float';
import { formatNumber } from './formatNumber';

/**
 * mod function, computes the modulus (remainder) of x/y
 * 
 * @param x Dividend
 * @param y Divisor
 * @returns The remainder of x/y
 */
export function mod(x: Float | number, y: Float | number): Float {
    const result = new Float();
    result.toGLSL = () => {
        const xStr = typeof x === 'number' ? formatNumber(x) : x.toGLSL();
        const yStr = typeof y === 'number' ? formatNumber(y) : y.toGLSL();
        return `${xStr} % ${yStr}`;
    };
    result.toWGSL = () => {
        const xStr = typeof x === 'number' ? formatNumber(x) : x.toWGSL();
        const yStr = typeof y === 'number' ? formatNumber(y) : y.toWGSL();
        return `${xStr} % ${yStr}`;
    };
    result.dependencies = [
        ...(typeof x === 'number' ? [] : [x]),
        ...(typeof y === 'number' ? [] : [y])
    ];
    return result;
}
