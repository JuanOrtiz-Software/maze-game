import { SeededRandom } from "../world/SeededRandom";

import {
    MazeConfig,
    MazeGrid,
    MazeResult,
} from "./MazeTypes";

export class MazeGenerator {
    private readonly random: SeededRandom;

    constructor(random: SeededRandom) {
        this.random = random;
    }

    public generate(config: MazeConfig): MazeResult {
        this.validateConfig(config);

        const grid = this.createGrid(
            config.width,
            config.height
        );

        const start = {
            x: 1,
            y: 1,
        };

        this.generateMaze(
            grid,
            start.x,
            start.y
        );

        const exit = this.findExit(
            grid,
            start
        );

        return {
            grid,
            width: config.width,
            height: config.height,
            start,
            exit,
        };
    }

    private validateConfig(config: MazeConfig): void {
        if (config.width < 5 || config.height < 5) {
            throw new Error(
                "Maze dimensions must be at least 5x5."
            );
        }

        if (
            config.width % 2 === 0 ||
            config.height % 2 === 0
        ) {
            throw new Error(
                "Maze dimensions must be odd numbers."
            );
        }
    }

    private createGrid(
        width: number,
        height: number
    ): MazeGrid {
        return Array.from(
            { length: height },
            () => Array<MazeGrid[number][number]>(
                width
            ).fill(1)
        );
    }

    private generateMaze(
        grid: MazeGrid,
        startX: number,
        startY: number
    ): void {
        grid[startY][startX] = 0;

        const directions = [
            { x: 0, y: -2 },
            { x: 2, y: 0 },
            { x: 0, y: 2 },
            { x: -2, y: 0 },
        ];

        this.shuffle(directions);

        for (const direction of directions) {
            const nextX = startX + direction.x;
            const nextY = startY + direction.y;

            if (!this.isInside(grid, nextX, nextY)) {
                continue;
            }

            if (grid[nextY][nextX] === 0) {
                continue;
            }

            const wallX =
                startX + direction.x / 2;

            const wallY =
                startY + direction.y / 2;

            grid[wallY][wallX] = 0;

            this.generateMaze(
                grid,
                nextX,
                nextY
            );
        }
    }

    private shuffle<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.random.nextInt(0, i);

            [array[i], array[j]] =
                [array[j], array[i]];
        }
    }

    private isInside(
        grid: MazeGrid,
        x: number,
        y: number
    ): boolean {
        return (
            y > 0 &&
            y < grid.length - 1 &&
            x > 0 &&
            x < grid[0].length - 1
        );
    }

    private findExit(
        grid: MazeGrid,
        start: { x: number; y: number }
    ): { x: number; y: number } {
        let exit = {
            x: start.x,
            y: start.y,
        };

        let maxDistance = 0;

        for (let y = 1; y < grid.length - 1; y++) {
            for (let x = 1; x < grid[y].length - 1; x++) {
                if (grid[y][x] !== 0) {
                    continue;
                }

                const distance =
                    Math.abs(x - start.x) +
                    Math.abs(y - start.y);

                if (distance > maxDistance) {
                    maxDistance = distance;

                    exit = {
                        x,
                        y,
                    };
                }
            }
        }

        return exit;
    }
}