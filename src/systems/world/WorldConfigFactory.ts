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
             * 5 chunks hacia cada lado.
             *
             * 11 × 11 = 121 chunks
             * de datos potencialmente disponibles.
             */
            preloadDistance: 5,

            /*
             * El radio de descarga es mayor
             * que el de precarga para evitar
             * generar/destruir continuamente
             * cuando el jugador se mueve
             * alrededor de una frontera.
             */
            unloadDistance: 7,
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