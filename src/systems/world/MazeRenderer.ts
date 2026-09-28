import Phaser from "phaser";
import { Chunk } from "./types/ChunkTypes";

export class MazeRenderer {
    private readonly scene: Phaser.Scene;
    private readonly graphicsMap: Map<string, Phaser.GameObjects.Graphics>;
    private readonly backgroundMap: Map<string, Phaser.GameObjects.Image>;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.graphicsMap = new Map();
        this.backgroundMap = new Map();
    }

    public render(
        chunk: Chunk,
        tileSize: number
    ): void {
        const key = `${chunk.coordinates.x},${chunk.coordinates.y}`;
        if (this.graphicsMap.has(key)) {
            return; // Already rendered
        }

        const graphics = this.scene.add.graphics();
        graphics.setDepth(10);
        this.graphicsMap.set(key, graphics);

        const grid = chunk.maze.grid;
        const width = grid[0].length;
        const height = grid.length;

        const offset = this.getChunkWorldOffset(chunk, tileSize, width, height);

        const chunkPixelWidth = width * tileSize;
        const chunkPixelHeight = height * tileSize;

        const bg = this.scene.add.image(
            offset.x + chunkPixelWidth / 2,
            offset.y + chunkPixelHeight / 2,
            "ground"
        );
        bg.setDepth(-10);

        const source = this.scene.textures.get("ground")?.getSourceImage();
        if (source) {
            const scaleX = chunkPixelWidth / source.width;
            const scaleY = chunkPixelHeight / source.height;
            bg.setScale(Math.max(scaleX, scaleY));
        }

        this.backgroundMap.set(key, bg);

        this.renderWalls(graphics, grid, offset, tileSize);
        this.renderConnections(graphics, chunk, offset, tileSize);
    }

    public removeChunk(coordinates: {x: number, y: number}): void {
        const key = `${coordinates.x},${coordinates.y}`;
        const graphics = this.graphicsMap.get(key);
        if (graphics) {
            graphics.destroy();
            this.graphicsMap.delete(key);
        }

        const bg = this.backgroundMap.get(key);
        if (bg) {
            bg.destroy();
            this.backgroundMap.delete(key);
        }
    }

    private renderWalls(
        graphics: Phaser.GameObjects.Graphics,
        grid: number[][],
        offset: { x: number; y: number; },
        tileSize: number
    ): void {
        const height = grid.length;
        const width = grid[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] !== 1) {
                    continue;
                }

                const wallX = offset.x + x * tileSize;
                const wallY = offset.y + y * tileSize;
                const inset = Math.max(2, Math.floor(tileSize * 0.08));

                graphics.fillStyle(0x2b2520, 1);
                graphics.fillRect(wallX, wallY, tileSize, tileSize);
                graphics.fillStyle(0x57483a, 1);
                graphics.fillRect(
                    wallX + inset,
                    wallY + inset,
                    tileSize - inset * 2,
                    tileSize - inset * 2,
                );

                graphics.lineStyle(
                    Math.max(2, Math.floor(tileSize * 0.035)),
                    0x806b54,
                    0.9,
                );
                graphics.lineBetween(
                    wallX + inset,
                    wallY + inset,
                    wallX + tileSize - inset,
                    wallY + inset,
                );
                graphics.lineBetween(
                    wallX + inset,
                    wallY + inset,
                    wallX + inset,
                    wallY + tileSize - inset,
                );

                graphics.lineStyle(
                    Math.max(2, Math.floor(tileSize * 0.04)),
                    0x171310,
                    0.95,
                );
                graphics.lineBetween(
                    wallX + inset,
                    wallY + tileSize - inset,
                    wallX + tileSize - inset,
                    wallY + tileSize - inset,
                );

                const crackSeed = (x * 17 + y * 31) % 3;
                graphics.lineStyle(
                    Math.max(1, Math.floor(tileSize * 0.018)),
                    0x241b16,
                    0.85,
                );
                graphics.lineBetween(
                    wallX + tileSize * (0.25 + crackSeed * 0.08),
                    wallY + tileSize * 0.3,
                    wallX + tileSize * 0.45,
                    wallY + tileSize * 0.52,
                );
                graphics.lineBetween(
                    wallX + tileSize * 0.45,
                    wallY + tileSize * 0.52,
                    wallX + tileSize * 0.38,
                    wallY + tileSize * 0.72,
                );
            }
        }
    }

    private renderConnections(
        graphics: Phaser.GameObjects.Graphics,
        chunk: Chunk,
        offset: { x: number; y: number; },
        tileSize: number
    ): void {
        const grid = chunk.maze.grid;
        const width = grid[0].length;
        const height = grid.length;
        const connectionSize = Math.max(8, Math.floor(tileSize * 0.5));

        graphics.fillStyle(0x3498db, 1);

        // NORTH
        if (chunk.connections.north.connected) {
            const x = chunk.connections.north.position;
            graphics.fillRect(
                offset.x + x * tileSize + (tileSize - connectionSize) / 2,
                offset.y,
                connectionSize,
                tileSize
            );
        }

        // SOUTH
        if (chunk.connections.south.connected) {
            const x = chunk.connections.south.position;
            graphics.fillRect(
                offset.x + x * tileSize + (tileSize - connectionSize) / 2,
                offset.y + (height - 1) * tileSize,
                connectionSize,
                tileSize
            );
        }

        // WEST
        if (chunk.connections.west.connected) {
            const y = chunk.connections.west.position;
            graphics.fillRect(
                offset.x,
                offset.y + y * tileSize + (tileSize - connectionSize) / 2,
                tileSize,
                connectionSize
            );
        }

        // EAST
        if (chunk.connections.east.connected) {
            const y = chunk.connections.east.position;
            graphics.fillRect(
                offset.x + (width - 1) * tileSize,
                offset.y + y * tileSize + (tileSize - connectionSize) / 2,
                tileSize,
                connectionSize
            );
        }
    }

    public getChunkWorldOffset(
        chunk: Chunk,
        tileSize: number,
        width: number,
        height: number
    ): { x: number; y: number; } {
        return {
            x: chunk.coordinates.x * width * tileSize,
            y: chunk.coordinates.y * height * tileSize,
        };
    }

    public destroy(): void {
        for (const graphics of this.graphicsMap.values()) {
            graphics.destroy();
        }
        this.graphicsMap.clear();

        for (const bg of this.backgroundMap.values()) {
            bg.destroy();
        }
        this.backgroundMap.clear();
    }
}