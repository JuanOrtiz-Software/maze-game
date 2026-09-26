import { ChunkGenerator } from "./systems/world/ChunkGenerator";
import { WorldConfig } from "./systems/world/types/WorldTypes";

const config: WorldConfig = {
    seed: 928371,
    chunkWidth: 31,
    chunkHeight: 31,
    tileSize: 32,
    renderDistance: 1,
};

const generator =
    new ChunkGenerator(config);

const chunk00 =
    generator.generate({
        x: 0,
        y: 0,
    });

const chunk10 =
    generator.generate({
        x: 1,
        y: 0,
    });

const chunk01 =
    generator.generate({
        x: 0,
        y: 1,
    });

console.log(
    "===== CHUNK CONNECTION TEST ====="
);

console.log("\nChunk (0,0):");
console.log(chunk00.connections);

console.log("\nChunk (1,0):");
console.log(chunk10.connections);

console.log("\nChunk (0,1):");
console.log(chunk01.connections);

console.log(
    "\n===== HORIZONTAL CONNECTION ====="
);

const horizontalConnected =
    chunk00.connections.east.connected ===
    chunk10.connections.west.connected;

const horizontalPosition =
    chunk00.connections.east.position ===
    chunk10.connections.west.position;

console.log(
    "Connected:",
    horizontalConnected
);

console.log(
    "Position:",
    horizontalPosition
);

console.log(
    "Valid:",
    horizontalConnected &&
    horizontalPosition
);

console.log(
    "\n===== VERTICAL CONNECTION ====="
);

const verticalConnected =
    chunk00.connections.south.connected ===
    chunk01.connections.north.connected;

const verticalPosition =
    chunk00.connections.south.position ===
    chunk01.connections.north.position;

console.log(
    "Connected:",
    verticalConnected
);

console.log(
    "Position:",
    verticalPosition
);

console.log(
    "Valid:",
    verticalConnected &&
    verticalPosition
);

console.log(
    "\n===== EDGE VALIDATION ====="
);

const horizontalPositionValue =
    chunk00.connections.east.position;

const horizontalEdgeOpen =
    chunk00.maze.grid[
        horizontalPositionValue
    ][chunk00.maze.width - 1] === 0;

const verticalPositionValue =
    chunk00.connections.south.position;

const verticalEdgeOpen =
    chunk00.maze.grid[
        chunk00.maze.height - 1
    ][verticalPositionValue] === 0;

console.log(
    "East edge open:",
    horizontalEdgeOpen
);

console.log(
    "South edge open:",
    verticalEdgeOpen
);

console.log(
    "\n================================="
);
console.log(
    "\n===== BOTH SIDES VALIDATION ====="
);

const eastPosition =
    chunk00.connections.east.position;

const eastOpenChunk00 =
    chunk00.maze.grid[
        eastPosition
    ][chunk00.maze.width - 1] === 0;

const westOpenChunk10 =
    chunk10.maze.grid[
        eastPosition
    ][0] === 0;

console.log(
    "Chunk (0,0) EAST open:",
    eastOpenChunk00
);

console.log(
    "Chunk (1,0) WEST open:",
    westOpenChunk10
);

console.log(
    "Horizontal passage complete:",
    eastOpenChunk00 &&
    westOpenChunk10
);


const southPosition =
    chunk00.connections.south.position;

const southOpenChunk00 =
    chunk00.maze.grid[
        chunk00.maze.height - 1
    ][southPosition] === 0;

const northOpenChunk01 =
    chunk01.maze.grid[
        0
    ][southPosition] === 0;

console.log(
    "\nChunk (0,0) SOUTH open:",
    southOpenChunk00
);

console.log(
    "Chunk (0,1) NORTH open:",
    northOpenChunk01
);

console.log(
    "Vertical passage complete:",
    southOpenChunk00 &&
    northOpenChunk01
);