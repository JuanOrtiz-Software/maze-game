export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

export default {
  clamp,
  distance,
};
