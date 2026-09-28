import {
    WorldConfigFactory,
} from "./systems/world/WorldConfigFactory";

import {
    ChunkStreamManager,
} from "./systems/world/ChunkStreamManager";

async function main(): Promise<void> {
    const config =
        WorldConfigFactory.create(
            1280,
            720,
            928371
        );

    const stream =
        new ChunkStreamManager(
            config
        );

    console.log(
        "Solicitando chunk (0,0)..."
    );

    const start =
        performance.now();

    const chunk =
        await stream.requestChunk({
            x: 0,
            y: 0,
        });

    const elapsed =
        performance.now() -
        start;

    console.log(
        "Chunk generado:",
        chunk.coordinates
    );

    console.log(
        "Tiempo:",
        `${elapsed.toFixed(2)} ms`
    );

    console.log(
        "Tamaño:",
        `${chunk.maze.width}x${chunk.maze.height}`
    );

    stream.destroy();
}

main().catch(
    error => {
        console.error(
            error
        );

        throw error;
    }
);