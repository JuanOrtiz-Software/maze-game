import { ChunkGenerator } from "./ChunkGenerator";
import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";
import { WorldConfig } from "./types/WorldTypes";

export class WorldGenerator {
    private readonly chunkGenerator: ChunkGenerator;

    constructor(config: WorldConfig) {
        this.chunkGenerator =
            new ChunkGenerator(config);
    }

    public generateChunk(
        coordinates: ChunkCoordinates
    ): Chunk {
        return this.chunkGenerator.generate(
            coordinates
        );
    }
}