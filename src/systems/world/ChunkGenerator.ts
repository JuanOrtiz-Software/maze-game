import { MazeGenerator } from "../maze/MazeGenerator";
import {
    Chunk,
    ChunkConnections,
    ChunkCoordinates,
} from "./types/ChunkTypes";
import { SeededRandom } from "./SeededRandom";
import { WorldConfig } from "./types/WorldTypes";

export class ChunkGenerator {
    private readonly config: WorldConfig;

    constructor(config: WorldConfig) {
        this.config = config;
    }

    public generate(
        coordinates: ChunkCoordinates
    ): Chunk {
        const random = this.createChunkRandom(
            coordinates
        );

        const mazeGenerator = new MazeGenerator(
            random
        );

        const maze = mazeGenerator.generate({
            width: this.config.chunkWidth,
            height: this.config.chunkHeight,
        });

        const connections =
            this.generateConnections(coordinates);

        return {
            coordinates,
            maze,
            connections,
        };
    }

    private createChunkRandom(
        coordinates: ChunkCoordinates
    ): SeededRandom {
        const seed = this.generateChunkSeed(
            coordinates
        );

        return new SeededRandom(seed);
    }

    private generateChunkSeed(
        coordinates: ChunkCoordinates
    ): number {
        let hash = this.config.seed;

        hash ^= coordinates.x * 374761393;
        hash ^= coordinates.y * 668265263;

        hash =
            (hash ^ (hash >>> 13)) *
            1274126177;

        return hash >>> 0;
    }

    private generateConnections(
        coordinates: ChunkCoordinates
    ): ChunkConnections {
        return {
            north: this.generateBoundary(
                coordinates.x,
                coordinates.y - 1
            ),

            south: this.generateBoundary(
                coordinates.x,
                coordinates.y
            ),

            west: this.generateBoundary(
                coordinates.x - 1,
                coordinates.y
            ),

            east: this.generateBoundary(
                coordinates.x,
                coordinates.y
            ),
        };
    }

    private generateBoundary(
        x: number,
        y: number
    ): boolean {
        const boundarySeed =
            this.generateBoundarySeed(x, y);

        const random =
            new SeededRandom(boundarySeed);

        return random.chance(0.5);
    }

    private generateBoundarySeed(
        x: number,
        y: number
    ): number {
        let hash = this.config.seed;

        hash ^= x * 374761393;
        hash ^= y * 668265263;

        hash =
            (hash ^ (hash >>> 13)) *
            1274126177;

        return hash >>> 0;
    }
}