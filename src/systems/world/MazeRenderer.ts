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
        this.graphics.fillStyle(
            0x202020,
            1
        );

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

                this.graphics.fillRect(
                    offset.x +
                        x * tileSize,
                    offset.y +
                        y * tileSize,
                    tileSize,
                    tileSize
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