export class RandomUtils {
  static int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static float(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}

export default RandomUtils;
