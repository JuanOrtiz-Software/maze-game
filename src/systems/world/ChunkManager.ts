import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";
import { WorldConfig } from "./types/WorldTypes";
import { WorldGenerator } from "./WorldGenerator";

export class ChunkManager {
    private readonly config: WorldConfig;
    private readonly worldGenerator: WorldGenerator;

    private readonly loadedChunks:
        Map<string, Chunk>;

    private currentChunk:
        ChunkCoordinates | null = null;

    constructor(
        config: WorldConfig,
        worldGenerator: WorldGenerator
    ) {
        this.config = config;
        this.worldGenerator = worldGenerator;
        this.loadedChunks = new Map();
    }

    public updatePlayerChunk(
        playerChunk: ChunkCoordinates
    ): void {
        if (
            this.currentChunk !== null &&
            this.isSameCoordinates(
                this.currentChunk,
                playerChunk
            )
        ) {
            return;
        }

        this.currentChunk = {
            x: playerChunk.x,
            y: playerChunk.y,
        };

        this.updateLoadedChunks();
    }

    public getLoadedChunks(): Chunk[] {
        return Array.from(
            this.loadedChunks.values()
        );
    }

    public getChunk(
        coordinates: ChunkCoordinates
    ): Chunk | undefined {
        return this.loadedChunks.get(
            this.createChunkKey(coordinates)
        );
    }

    public hasChunk(
        coordinates: ChunkCoordinates
    ): boolean {
        return this.loadedChunks.has(
            this.createChunkKey(coordinates)
        );
    }

    public clear(): void {
        this.loadedChunks.clear();
        this.currentChunk = null;
    }

    private updateLoadedChunks(): void {
        if (this.currentChunk === null) {
            return;
        }

        const requiredChunks =
            this.calculateRequiredChunks(
                this.currentChunk
            );

        for (const coordinates of requiredChunks) {
            this.loadChunk(coordinates);
        }

        this.unloadUnusedChunks(
            requiredChunks
        );
    }

    private calculateRequiredChunks(
        center: ChunkCoordinates
    ): ChunkCoordinates[] {
        const chunks: ChunkCoordinates[] = [];

        for (
            let y = -this.config.renderDistance;
            y <= this.config.renderDistance;
            y++
        ) {
            for (
                let x = -this.config.renderDistance;
                x <= this.config.renderDistance;
                x++
            ) {
                chunks.push({
                    x: center.x + x,
                    y: center.y + y,
                });
            }
        }

        return chunks;
    }

    private loadChunk(
        coordinates: ChunkCoordinates
    ): void {
        const key =
            this.createChunkKey(coordinates);

        if (this.loadedChunks.has(key)) {
            return;
        }

        const chunk =
            this.worldGenerator.generateChunk(
                coordinates
            );

        this.loadedChunks.set(
            key,
            chunk
        );
    }

    private unloadUnusedChunks(
        requiredChunks: ChunkCoordinates[]
    ): void {
        const requiredKeys =
            new Set(
                requiredChunks.map(
                    coordinates =>
                        this.createChunkKey(
                            coordinates
                        )
                )
            );

        for (
            const key
            of this.loadedChunks.keys()
        ) {
            if (
                !requiredKeys.has(key)
            ) {
                this.loadedChunks.delete(key);
            }
        }
    }

    private createChunkKey(
        coordinates: ChunkCoordinates
    ): string {
        return `${coordinates.x},${coordinates.y}`;
    }

    private isSameCoordinates(
        first: ChunkCoordinates,
        second: ChunkCoordinates
    ): boolean {
        return (
            first.x === second.x &&
            first.y === second.y
        );
    }
}