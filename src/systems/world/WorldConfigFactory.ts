import { WorldConfig } from "./types/WorldTypes";

export class WorldConfigFactory {
    private constructor() {
        // Utility class.
    }

    public static create(
        viewportWidth: number,
        viewportHeight: number,
        seed: number
    ): WorldConfig {
        const tileSize =
            this.calculateTileSize(
                viewportWidth,
                viewportHeight
            );

        const chunkWidth =
            this.calculateOddCellCount(
                viewportWidth,
                tileSize
            );

        const chunkHeight =
            this.calculateOddCellCount(
                viewportHeight,
                tileSize
            );

        return {
            seed,

            chunkWidth,

            chunkHeight,

            tileSize,

            /*
             * Reducido a 2 para evitar saturar los Web Workers.
             * 2 implica una grilla de 5x5 (25 chunks) pre-cargados.
             */
            preloadDistance: 2,

            /*
             * Distancia de descarga.
             */
            unloadDistance: 3,
        };
    }

    private static calculateTileSize(
        viewportWidth: number,
        viewportHeight: number
    ): number {
        const baseSize = 80;

        const scale =
            Math.min(
                viewportWidth / 1280,
                viewportHeight / 720
            );

        return Math.max(
            48,
            Math.floor(
                baseSize * scale
            )
        );
    }

    private static calculateOddCellCount(
        viewportSize: number,
        tileSize: number
    ): number {
        const rawCount =
            Math.floor(
                viewportSize /
                tileSize
            );

        let count =
            rawCount % 2 === 0
                ? rawCount - 1
                : rawCount;

        count =
            Math.max(
                7,
                count
            );

        return count;
    }
}