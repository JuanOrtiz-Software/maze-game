import { MazeResult } from "../../maze/MazeTypes";

export interface ChunkCoordinates {
    x: number;
    y: number;
}

export interface ChunkConnections {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
}

export interface Chunk {
    coordinates: ChunkCoordinates;
    maze: MazeResult;
    connections: ChunkConnections;
}