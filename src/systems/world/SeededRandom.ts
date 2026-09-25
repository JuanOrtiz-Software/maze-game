export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed >>> 0;
    }

    public next(): number {
        this.seed = (
            (this.seed * 1664525) +
            1013904223
        ) >>> 0;

        return this.seed / 4294967296;
    }

    public nextInt(min: number, max: number): number {
        if (min > max) {
            throw new Error(
                `Invalid range: min (${min}) cannot be greater than max (${max}).`
            );
        }

        return Math.floor(
            this.next() * (max - min + 1)
        ) + min;
    }

    public chance(probability: number): boolean {
        if (probability < 0 || probability > 1) {
            throw new Error(
                `Probability must be between 0 and 1. Received: ${probability}`
            );
        }

        return this.next() < probability;
    }
}