import { MazeResult } from "../../maze/MazeTypes";

export interface ChunkCoordinates {
    x: number;
    y: number;
}

export interface ChunkConnection {
    connected: boolean;
    position: number;
}

export interface ChunkConnections {
    north: ChunkConnection;
    south: ChunkConnection;
    east: ChunkConnection;
    west: ChunkConnection;
}

export interface Chunk {
    coordinates: ChunkCoordinates;
    maze: MazeResult;
    connections: ChunkConnections;
}