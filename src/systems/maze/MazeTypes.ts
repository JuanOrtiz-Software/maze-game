export type MazeCell = 0 | 1;

export type MazeGrid = MazeCell[][];

export interface MazeConfig {
    width: number;
    height: number;
}

export interface MazeResult {
    grid: MazeGrid;
    width: number;
    height: number;
    start: {
        x: number;
        y: number;
    };
    exit: {
        x: number;
        y: number;
    };
}