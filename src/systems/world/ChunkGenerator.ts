import { MazeGenerator } from "../maze/MazeGenerator";
import { MazeGrid } from "../maze/MazeTypes";
import { MazeUtils } from "../maze/MazeUtils";

import {
    Chunk,
    ChunkConnections,
    ChunkCoordinates,
} from "./types/ChunkTypes";

import { SeededRandom } from "./SeededRandom";
import { WorldConfig } from "./types/WorldTypes";

type BoundaryDirection =
    | "north"
    | "south"
    | "east"
    | "west";

export class ChunkGenerator {
    private readonly config: WorldConfig;

    constructor(config: WorldConfig) {
        this.config = config;
    }

    public generate(
        coordinates: ChunkCoordinates
    ): Chunk {
        const random =
            this.createChunkRandom(
                coordinates
            );

        const mazeGenerator =
            new MazeGenerator(random);

        const maze =
            mazeGenerator.generate({
                width: this.config.chunkWidth,
                height: this.config.chunkHeight,
            });

        const connections =
            this.generateConnections(
                coordinates
            );

        this.applyConnections(
            maze.grid,
            connections
        );

        return {
            coordinates,
            maze,
            connections,
        };
    }

    /**
     * Crea el generador aleatorio específico
     * para un chunk.
     *
     * La misma semilla y las mismas coordenadas
     * siempre producen el mismo resultado.
     */
    private createChunkRandom(
        coordinates: ChunkCoordinates
    ): SeededRandom {
        const seed =
            this.generateChunkSeed(
                coordinates
            );

        return new SeededRandom(seed);
    }

    /**
     * Genera una semilla única para cada chunk.
     */
    private generateChunkSeed(
        coordinates: ChunkCoordinates
    ): number {
        let hash =
            this.config.seed;

        hash ^=
            coordinates.x *
            374761393;

        hash ^=
            coordinates.y *
            668265263;

        hash =
            (hash ^ (hash >>> 13)) *
            1274126177;

        return hash >>> 0;
    }

    /**
     * Genera las cuatro conexiones del chunk.
     *
     * Cada frontera tiene una semilla propia,
     * independiente del chunk.
     *
     * Esto garantiza que:
     *
     * Chunk A EAST
     *       =
     * Chunk B WEST
     *
     * y:
     *
     * Chunk A SOUTH
     *       =
     * Chunk B NORTH
     */
    private generateConnections(
        coordinates: ChunkCoordinates
    ): ChunkConnections {
        return {
            north:
                this.generateBoundary(
                    coordinates.x,
                    coordinates.y - 1,
                    "north"
                ),

            south:
                this.generateBoundary(
                    coordinates.x,
                    coordinates.y,
                    "south"
                ),

            west:
                this.generateBoundary(
                    coordinates.x - 1,
                    coordinates.y,
                    "west"
                ),

            east:
                this.generateBoundary(
                    coordinates.x,
                    coordinates.y,
                    "east"
                ),
        };
    }

    /**
     * Genera una frontera entre dos chunks.
     *
     * Todas las fronteras están conectadas.
     *
     * Esto garantiza que ningún chunk quede
     * aislado del mundo.
     */
    private generateBoundary(
        x: number,
        y: number,
        direction: BoundaryDirection
    ): {
        connected: boolean;
        position: number;
    } {
        const boundarySeed =
            this.generateBoundarySeed(
                x,
                y
            );

        const random =
            new SeededRandom(
                boundarySeed
            );

        const position =
            this.generateConnectionPosition(
                random,
                direction
            );

        return {
            connected: true,
            position,
        };
    }

    /**
     * Genera una posición válida para una salida.
     *
     * Las posiciones siempre son impares:
     *
     * 1, 3, 5, 7, 9...
     *
     * Esto coincide con la estructura del
     * MazeGenerator.
     */
    private generateConnectionPosition(
        random: SeededRandom,
        direction: BoundaryDirection
    ): number {
        const maxPosition =
            direction === "north" ||
            direction === "south"
                ? this.config.chunkWidth - 2
                : this.config.chunkHeight - 2;

        const roomCount =
            Math.floor(
                (maxPosition - 1) / 2
            );

        const roomIndex =
            random.nextInt(
                0,
                roomCount
            );

        return (
            1 +
            roomIndex * 2
        );
    }

    /**
     * Abre físicamente las conexiones
     * en el MazeGrid.
     */
    private applyConnections(
        grid: MazeGrid,
        connections: ChunkConnections
    ): void {
        if (
            connections.north.connected
        ) {
            MazeUtils.openEdge(
                grid,
                "north",
                connections.north.position
            );
        }

        if (
            connections.south.connected
        ) {
            MazeUtils.openEdge(
                grid,
                "south",
                connections.south.position
            );
        }

        if (
            connections.west.connected
        ) {
            MazeUtils.openEdge(
                grid,
                "west",
                connections.west.position
            );
        }

        if (
            connections.east.connected
        ) {
            MazeUtils.openEdge(
                grid,
                "east",
                connections.east.position
            );
        }
    }

    /**
     * Genera una semilla para una frontera.
     *
     * La frontera entre:
     *
     * (0,0) EAST
     *
     * y
     *
     * (1,0) WEST
     *
     * utiliza exactamente la misma semilla.
     */
    private generateBoundarySeed(
        x: number,
        y: number
    ): number {
        let hash =
            this.config.seed;

        hash ^=
            x *
            374761393;

        hash ^=
            y *
            668265263;

        hash =
            (hash ^ (hash >>> 13)) *
            1274126177;

        return hash >>> 0;
    }
}