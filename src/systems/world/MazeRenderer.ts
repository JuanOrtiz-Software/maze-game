import Phaser from "phaser";
import { Chunk } from "./types/ChunkTypes";

export class MazeRenderer {
    private readonly scene: Phaser.Scene;
    private readonly graphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        this.graphics =
            scene.add.graphics();

        this.graphics.setDepth(10);
    }

    public render(
        chunk: Chunk,
        tileSize: number
    ): void {
        this.graphics.clear();

        const grid =
            chunk.maze.grid;

        const width =
            grid[0].length;

        const height =
            grid.length;

        const offset =
            this.calculateOffset(
                width,
                height,
                tileSize
            );

        this.renderWalls(
            grid,
            offset,
            tileSize
        );

        this.renderConnections(
            chunk,
            offset,
            tileSize
        );
    }

    private renderWalls(
        grid: number[][],
        offset: {
            x: number;
            y: number;
        },
        tileSize: number
    ): void {
        const height =
            grid.length;

        const width =
            grid[0].length;

        for (
            let y = 0;
            y < height;
            y++
        ) {
            for (
                let x = 0;
                x < width;
                x++
            ) {
                if (
                    grid[y][x] !== 1
                ) {
                    continue;
                }

                const wallX = offset.x + x * tileSize;
                const wallY = offset.y + y * tileSize;
                const inset = Math.max(2, Math.floor(tileSize * 0.08));

                // Base de piedra oscura y bloque interior con relieve.
                this.graphics.fillStyle(0x2b2520, 1);
                this.graphics.fillRect(wallX, wallY, tileSize, tileSize);
                this.graphics.fillStyle(0x57483a, 1);
                this.graphics.fillRect(
                    wallX + inset,
                    wallY + inset,
                    tileSize - inset * 2,
                    tileSize - inset * 2,
                );

                // Borde superior/lateral iluminado y base erosionada.
                this.graphics.lineStyle(
                    Math.max(2, Math.floor(tileSize * 0.035)),
                    0x806b54,
                    0.9,
                );
                this.graphics.lineBetween(
                    wallX + inset,
                    wallY + inset,
                    wallX + tileSize - inset,
                    wallY + inset,
                );
                this.graphics.lineBetween(
                    wallX + inset,
                    wallY + inset,
                    wallX + inset,
                    wallY + tileSize - inset,
                );

                this.graphics.lineStyle(
                    Math.max(2, Math.floor(tileSize * 0.04)),
                    0x171310,
                    0.95,
                );
                this.graphics.lineBetween(
                    wallX + inset,
                    wallY + tileSize - inset,
                    wallX + tileSize - inset,
                    wallY + tileSize - inset,
                );

                // Grietas deterministas: no cambian al redibujar o cambiar de chunk.
                const crackSeed = (x * 17 + y * 31) % 3;
                this.graphics.lineStyle(
                    Math.max(1, Math.floor(tileSize * 0.018)),
                    0x241b16,
                    0.85,
                );
                this.graphics.lineBetween(
                    wallX + tileSize * (0.25 + crackSeed * 0.08),
                    wallY + tileSize * 0.3,
                    wallX + tileSize * 0.45,
                    wallY + tileSize * 0.52,
                );
                this.graphics.lineBetween(
                    wallX + tileSize * 0.45,
                    wallY + tileSize * 0.52,
                    wallX + tileSize * 0.38,
                    wallY + tileSize * 0.72,
                );
            }
        }
    }

    private renderConnections(
        chunk: Chunk,
        offset: {
            x: number;
            y: number;
        },
        tileSize: number
    ): void {
        const grid =
            chunk.maze.grid;

        const width =
            grid[0].length;

        const height =
            grid.length;

        const connectionSize =
            Math.max(
                8,
                Math.floor(
                    tileSize * 0.5
                )
            );

        this.graphics.fillStyle(
            0x3498db,
            1
        );

        // NORTH
        if (
            chunk.connections.north.connected
        ) {
            const x =
                chunk.connections.north.position;

            this.graphics.fillRect(
                offset.x +
                    x * tileSize +
                    (tileSize -
                        connectionSize) / 2,
                offset.y,
                connectionSize,
                tileSize
            );
        }

        // SOUTH
        if (
            chunk.connections.south.connected
        ) {
            const x =
                chunk.connections.south.position;

            this.graphics.fillRect(
                offset.x +
                    x * tileSize +
                    (tileSize -
                        connectionSize) / 2,
                offset.y +
                    (height - 1) *
                    tileSize,
                connectionSize,
                tileSize
            );
        }

        // WEST
        if (
            chunk.connections.west.connected
        ) {
            const y =
                chunk.connections.west.position;

            this.graphics.fillRect(
                offset.x,
                offset.y +
                    y * tileSize +
                    (tileSize -
                        connectionSize) / 2,
                tileSize,
                connectionSize
            );
        }

        // EAST
        if (
            chunk.connections.east.connected
        ) {
            const y =
                chunk.connections.east.position;

            this.graphics.fillRect(
                offset.x +
                    (width - 1) *
                    tileSize,
                offset.y +
                    y * tileSize +
                    (tileSize -
                        connectionSize) / 2,
                tileSize,
                connectionSize
            );
        }
    }

    public getOffset(
        chunk: Chunk,
        tileSize: number
    ): {
        x: number;
        y: number;
    } {
        const width =
            chunk.maze.grid[0].length;

        const height =
            chunk.maze.grid.length;

        return this.calculateOffset(
            width,
            height,
            tileSize
        );
    }

    private calculateOffset(
        width: number,
        height: number,
        tileSize: number
    ): {
        x: number;
        y: number;
    } {
        const worldWidth =
            width * tileSize;

        const worldHeight =
            height * tileSize;

        return {
            x: Math.floor(
                (
                    this.scene.scale.width -
                    worldWidth
                ) / 2
            ),

            y: Math.floor(
                (
                    this.scene.scale.height -
                    worldHeight
                ) / 2
            ),
        };
    }

    public destroy(): void {
        this.graphics.destroy();
    }
}