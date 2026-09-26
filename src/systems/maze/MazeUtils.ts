import {
    MazeGrid,
    MazeResult,
} from "./MazeTypes";

export interface MazePosition {
    x: number;
    y: number;
}

export type MazeEdge =
    | "north"
    | "south"
    | "east"
    | "west";

export class MazeUtils {
    private constructor() {
        // Clase de utilidades. No puede ser instanciada.
    }

    /**
     * Comprueba si existe un camino desde el inicio
     * hasta la salida del laberinto.
     */
    public static isConnected(
        maze: MazeResult
    ): boolean {
        const {
            grid,
            start,
            exit,
        } = maze;

        const visited =
            this.createVisitedGrid(grid);

        const queue: MazePosition[] = [start];

        visited[start.y][start.x] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (
                current.x === exit.x &&
                current.y === exit.y
            ) {
                return true;
            }

            const neighbors =
                this.getNeighbors(
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

    /**
     * Obtiene las posiciones de camino disponibles
     * cerca de uno de los cuatro bordes del laberinto.
     *
     * Estas posiciones podrán utilizarse posteriormente
     * para crear conexiones entre chunks.
     */
    public static getEdgePositions(
        grid: MazeGrid,
        edge: MazeEdge
    ): MazePosition[] {
        const positions: MazePosition[] = [];

        if (
            edge === "north" ||
            edge === "south"
        ) {
            const y =
                edge === "north"
                    ? 1
                    : grid.length - 2;

            for (
                let x = 1;
                x < grid[0].length - 1;
                x += 2
            ) {
                if (grid[y][x] === 0) {
                    positions.push({
                        x,
                        y,
                    });
                }
            }
        }

        if (
            edge === "west" ||
            edge === "east"
        ) {
            const x =
                edge === "west"
                    ? 1
                    : grid[0].length - 2;

            for (
                let y = 1;
                y < grid.length - 1;
                y += 2
            ) {
                if (grid[y][x] === 0) {
                    positions.push({
                        x,
                        y,
                    });
                }
            }
        }

        return positions;
    }

    /**
     * Comprueba si una posición está dentro del laberinto.
     */
    public static isInside(
        grid: MazeGrid,
        position: MazePosition
    ): boolean {
        return (
            position.x >= 0 &&
            position.x < grid[0].length &&
            position.y >= 0 &&
            position.y < grid.length
        );
    }

    /**
     * Comprueba si una posición representa una celda
     * transitable.
     */
    public static isWalkable(
        grid: MazeGrid,
        position: MazePosition
    ): boolean {
        if (!this.isInside(grid, position)) {
            return false;
        }

        return (
            grid[position.y][position.x] === 0
        );
    }

    /**
     * Crea una matriz utilizada para registrar
     * las celdas que ya fueron visitadas.
     */
    private static createVisitedGrid(
        grid: MazeGrid
    ): boolean[][] {
        return Array.from(
            { length: grid.length },
            () =>
                Array(grid[0].length).fill(false)
        );
    }

    /**
     * Obtiene las celdas transitables adyacentes
     * a una posición.
     */
    public static openEdge(
        grid: MazeGrid,
        edge: MazeEdge,
        position: number
    ): void {
        if (
            position <= 0 ||
            position >= grid[0].length - 1 ||
            position % 2 === 0
        ) {
            throw new Error(
                `Invalid edge position: ${position}`
            );
        }

        switch (edge) {
            case "north":
                grid[0][position] = 0;
                break;

            case "south":
                grid[grid.length - 1][position] = 0;
                break;

            case "west":
                grid[position][0] = 0;
                break;

            case "east":
                grid[position][grid[0].length - 1] = 0;
                break;
        }
    }

    private static getNeighbors(
        grid: MazeGrid,
        position: MazePosition
    ): MazePosition[] {
        const directions: MazePosition[] = [
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
                    neighbor
                )
            );
    }
}