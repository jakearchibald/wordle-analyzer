import { Luck } from 'shared-types/index';

/**
 * Escape a string for insertion in a style or script tag
 */
export function escapeStyleScriptContent(str: string): string {
  return str
    .replace(/<!--/g, '<\\!--')
    .replace(/<script/g, '<\\script')
    .replace(/<\/script/g, '<\\/script')
    .replace(/<style/g, '<\\style')
    .replace(/<\/style/g, '<\\/style');
}

export function packValues(data: number[], sizes: readonly number[]): number {
  let result = 0;
  let mult = 1;
  let max = 0;

  for (const [i, input] of data.entries()) {
    result += input * mult;
    const size = sizes[i];
    mult *= size;
    max += size;
  }

  if (max > Number.MAX_SAFE_INTEGER) {
    throw Error('Result is unreliable (larger than MAX_SAFE_INTEGER)');
  }

  return result;
}

export function unpackValues(data: number, sizes: readonly number[]): number[] {
  const result: number[] = [];

  for (const size of sizes) {
    const item = data % size;
    result.push(item);
    data = (data - item) / size;
  }

  return result;
}

const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// binary to string lookup table
const b2s = alphabet.split('');

// string to binary lookup table
// 123 == 'z'.charCodeAt(0) + 1
const s2b = new Array(123);
for (let i = 0; i < alphabet.length; i++) {
  s2b[alphabet.charCodeAt(i)] = i;
}

// number to base64
export const ntob = (number: number): string => {
  if (number < 0) return `-${ntob(-number)}`;

  let lo = number >>> 0;
  let hi = (number / 4294967296) >>> 0;

  let right = '';
  while (hi > 0) {
    right = b2s[0x3f & lo] + right;
    lo >>>= 6;
    lo |= (0x3f & hi) << 26;
    hi >>>= 6;
  }

  let left = '';
  do {
    left = b2s[0x3f & lo] + left;
    lo >>>= 6;
  } while (lo > 0);

  return left + right;
};

// base64 to number
export const bton = (base64: string): number => {
  let number = 0;
  const sign = base64.charAt(0) === '-' ? 1 : 0;

  for (let i = sign; i < base64.length; i++) {
    number = number * 64 + s2b[base64.charCodeAt(i)];
  }

  return sign ? -number : number;
};

// Box state * 5
// Guess rating
// Luck rating
export const socialDataSizes = [3, 3, 3, 3, 3, 6, 13] as const;

export const cellToNum = { a: 0, p: 1, c: 2 };

export function guessQualityToStars(quality: number): number {
  if (quality > 0.97) return 5;
  if (quality > 0.9) return 4;
  if (quality > 0.75) return 3;
  if (quality > 0.5) return 2;
  if (quality !== 0) return 1;
  return 0;
}

export function getLuckIndex({ good, chance }: Luck): number {
  if (chance > 1 / 2) return 0;

  if (good) {
    if (chance > 1 / 5) return 1;
    if (chance > 1 / 10) return 2;
    if (chance > 1 / 50) return 3;
    if (chance > 1 / 100) return 4;
    if (chance > 1 / 1000) return 5;
    return 6;
  }
  if (chance > 1 / 5) return 7;
  if (chance > 1 / 10) return 8;
  if (chance > 1 / 50) return 9;
  if (chance > 1 / 100) return 10;
  if (chance > 1 / 1000) return 11;
  return 12;
}

export const luckValues = [
  'Neutral',
  'Lucky',
  'Very lucky',
  'Super lucky',
  'Extremely lucky',
  'Unbelievably lucky',
  'WTF HOW??',
  'Unlucky',
  'Very unlucky',
  'Super unlucky',
  'Extremely unlucky',
  'Unbelievably unlucky',
  `Oh god I'm so sorry`,
] as const;
