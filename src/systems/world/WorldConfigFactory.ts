import { WorldConfig } from "./types/WorldTypes";

export class WorldConfigFactory {
    private constructor() {
        // Clase de utilidades.
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
            renderDistance: 1,
        };
    }

    private static calculateTileSize(
        viewportWidth: number,
        viewportHeight: number
    ): number {
        /*
         * Tamaño base de cada celda.
         *
         * Aumentarlo hace que:
         *
         * - paredes sean más grandes
         * - pasillos sean más grandes
         * - el jugador tenga más espacio
         * - las colisiones sean más cómodas
         */
        const baseSize = 96;

        const scale =
            Math.min(
                viewportWidth / 1280,
                viewportHeight / 720
            );

        return Math.max(
            56,
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
                viewportSize / tileSize
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