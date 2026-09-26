import {
    MazeGrid,
    MazeResult,
} from "./MazeTypes";

interface Position {
    x: number;
    y: number;
}

export class MazeUtils {
    private constructor() {
        // Utility class. Cannot be instantiated.
    }

    public static isConnected(maze: MazeResult): boolean {
        const {
            grid,
            start,
            exit,
        } = maze;

        const visited = this.createVisitedGrid(
            grid
        );

        const queue: Position[] = [start];

        visited[start.y][start.x] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (
                current.x === exit.x &&
                current.y === exit.y
            ) {
                return true;
            }

            const neighbors = this.getNeighbors(
                grid,
                current
            );

            for (const neighbor of neighbors) {
                if (
                    visited[neighbor.y][neighbor.x]
                ) {
                    continue;
                }

                visited[neighbor.y][neighbor.x] = true;
                queue.push(neighbor);
            }
        }

        return false;
    }

    private static createVisitedGrid(
        grid: MazeGrid
    ): boolean[][] {
        return Array.from(
            { length: grid.length },
            () => Array(grid[0].length).fill(false)
        );
    }

    private static getNeighbors(
        grid: MazeGrid,
        position: Position
    ): Position[] {
        const directions: Position[] = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
        ];

        return directions
            .map(direction => ({
                x: position.x + direction.x,
                y: position.y + direction.y,
            }))
            .filter(neighbor =>
                this.isWalkable(
                    grid,
                    neighbor.x,
                    neighbor.y
                )
            );
    }

    private static isWalkable(
        grid: MazeGrid,
        x: number,
        y: number
    ): boolean {
        if (
            y < 0 ||
            y >= grid.length ||
            x < 0 ||
            x >= grid[0].length
        ) {
            return false;
        }

        return grid[y][x] === 0;
    }
}