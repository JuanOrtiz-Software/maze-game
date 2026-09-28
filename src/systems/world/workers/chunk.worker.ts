import { WorldGenerator } from "../WorldGenerator";

import {
    Chunk,
    ChunkCoordinates,
} from "../types/ChunkTypes";

import { WorldConfig } from "../types/WorldTypes";

interface InitializeMessage {
    type: "initialize";

    config: WorldConfig;
}

interface GenerateChunkMessage {
    type: "generate";

    requestId: number;

    coordinates: ChunkCoordinates;
}

interface WorkerReadyMessage {
    type: "ready";
}

interface WorkerGeneratedMessage {
    type: "generated";

    requestId: number;

    coordinates: ChunkCoordinates;

    chunk: Chunk;
}

interface WorkerErrorMessage {
    type: "error";

    requestId: number;

    coordinates: ChunkCoordinates;

    error: string;
}

type WorkerRequest =
    | InitializeMessage
    | GenerateChunkMessage;
let worldGenerator:
    WorldGenerator | null = null;

/**
 * Inicializa el generador procedural
 * dentro del Worker.
 */
function initialize(
    config: WorldConfig
): void {
    worldGenerator =
        new WorldGenerator(config);
}

/**
 * Genera un chunk.
 */
function generateChunk(
    message: GenerateChunkMessage
): void {
    if (!worldGenerator) {
        throw new Error(
            "WorldGenerator has not been initialized."
        );
    }

    const chunk =
        worldGenerator.generateChunk(
            message.coordinates
        );

    const response:
        WorkerGeneratedMessage = {
        type: "generated",

        requestId:
            message.requestId,

        coordinates:
            message.coordinates,

        chunk,
    };

    self.postMessage(
        response
    );
}

/**
 * Punto de entrada del Worker.
 */
self.onmessage = (
    event: MessageEvent<WorkerRequest>
): void => {
    const message =
        event.data;

    try {
        if (
            message.type ===
            "initialize"
        ) {
            initialize(
                message.config
            );

            const response:
                WorkerReadyMessage = {
                type: "ready",
            };

            self.postMessage(
                response
            );

            return;
        }

        if (
            message.type ===
            "generate"
        ) {
            generateChunk(
                message
            );
        }
    } catch (error) {
        if (
            message.type !==
            "generate"
        ) {
            throw error;
        }

        const response:
            WorkerErrorMessage = {
            type: "error",

            requestId:
                message.requestId,

            coordinates:
                message.coordinates,

            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        };

        self.postMessage(
            response
        );
    }
};

export {};