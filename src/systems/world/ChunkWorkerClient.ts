import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";

import { WorldConfig } from "./types/WorldTypes";
import { WorldGenerator } from "./WorldGenerator";

interface PendingRequest {
    requestId: number;

    coordinates: ChunkCoordinates;

    workerIndex: number;

    resolve: (
        chunk: Chunk
    ) => void;

    reject: (
        error: Error
    ) => void;
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

interface WorkerReadyMessage {
    type: "ready";
}

type WorkerResponse =
    | WorkerGeneratedMessage
    | WorkerErrorMessage
    | WorkerReadyMessage;

interface WorkerSlot {
    worker: Worker;

    activeJobs: number;

    assignedRequestIds: Set<number>;
}

export class ChunkWorkerClient {
    private readonly config: WorldConfig;

    private readonly pool: WorkerSlot[] = [];

    private readonly pendingRequests:
        Map<number, PendingRequest> = new Map();

    private readonly fallbackGenerator?: WorldGenerator;

    private nextRequestId = 1;

    private isDestroyed = false;

    private readonly maxJobsPerWorker = 1;

    constructor(
        config: WorldConfig,
        customPoolSize?: number
    ) {
        this.config = config;

        /*
         * Detectar si el entorno soporta Web Workers (Browser)
         * o si estamos ejecutando bajo Node.js (por ejemplo, tsx test-worker.ts).
         */
        if (typeof Worker !== "undefined") {
            const defaultPoolSize =
                typeof navigator !== "undefined" && navigator.hardwareConcurrency
                    ? Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4)
                    : 2;

            const poolSize = customPoolSize ?? defaultPoolSize;

            for (let i = 0; i < poolSize; i++) {
                this.pool.push(this.createWorkerSlot(i));
            }
        } else {
            /*
             * Fallback exclusivo para entornos sin Web Workers (Node.js/CLI tests).
             * En el navegador, siempre se usan los Web Workers reales.
             */
            this.fallbackGenerator = new WorldGenerator(config);
        }
    }

    /**
     * Indica si hay al menos un worker disponible en el pool
     * para aceptar un nuevo trabajo.
     */
    public hasAvailableWorker(): boolean {
        if (this.isDestroyed) {
            return false;
        }

        if (this.fallbackGenerator) {
            return true;
        }

        return this.pool.some(
            slot => slot.activeJobs < this.maxJobsPerWorker
        );
    }

    /**
     * Número de workers activos en el pool.
     */
    public getPoolSize(): number {
        return this.fallbackGenerator ? 1 : this.pool.length;
    }

    /**
     * Número de trabajos actualmente en proceso en los workers.
     */
    public getActiveJobCount(): number {
        return this.pendingRequests.size;
    }

    /**
     * Solicita la generación de un chunk al pool de Web Workers.
     */
    public generateChunk(
        coordinates: ChunkCoordinates
    ): Promise<Chunk> {
        if (this.isDestroyed) {
            return Promise.reject(
                new Error("ChunkWorkerClient has been destroyed.")
            );
        }

        const requestId = this.nextRequestId++;

        /*
         * Entorno Node.js sin Worker nativo (tests de consola)
         */
        if (this.fallbackGenerator) {
            return new Promise<Chunk>((resolve, reject) => {
                queueMicrotask(() => {
                    if (this.isDestroyed) {
                        reject(new Error("ChunkWorkerClient was destroyed."));
                        return;
                    }

                    try {
                        const chunk = this.fallbackGenerator!.generateChunk(coordinates);
                        resolve(chunk);
                    } catch (error) {
                        reject(
                            error instanceof Error ? error : new Error(String(error))
                        );
                    }
                });
            });
        }

        return new Promise<Chunk>((resolve, reject) => {
            const availableSlotIndex = this.findBestWorkerSlotIndex();

            if (availableSlotIndex === -1) {
                reject(new Error("No worker available in pool."));
                return;
            }

            const slot = this.pool[availableSlotIndex];

            this.pendingRequests.set(requestId, {
                requestId,
                coordinates,
                workerIndex: availableSlotIndex,
                resolve,
                reject,
            });

            slot.activeJobs++;
            slot.assignedRequestIds.add(requestId);

            slot.worker.postMessage({
                type: "generate",
                requestId,
                coordinates,
            });
        });
    }

    /**
     * Libera todos los Web Workers del pool.
     */
    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        for (const request of this.pendingRequests.values()) {
            request.reject(
                new Error("ChunkWorkerClient was destroyed.")
            );
        }

        this.pendingRequests.clear();

        for (const slot of this.pool) {
            slot.assignedRequestIds.clear();
            slot.activeJobs = 0;
            slot.worker.terminate();
        }

        this.pool.length = 0;
    }

    private createWorkerSlot(index: number): WorkerSlot {
        const worker = new Worker(
            new URL("./workers/chunk.worker.ts", import.meta.url),
            {
                type: "module",
            }
        );

        const slot: WorkerSlot = {
            worker,
            activeJobs: 0,
            assignedRequestIds: new Set(),
        };

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            this.handleMessage(index, event.data);
        };

        worker.onerror = (event: ErrorEvent) => {
            this.handleWorkerError(index, event);
        };

        worker.postMessage({
            type: "initialize",
            config: this.config,
        });

        return slot;
    }

    private findBestWorkerSlotIndex(): number {
        let bestIndex = -1;
        let lowestLoad = Number.POSITIVE_INFINITY;

        for (let i = 0; i < this.pool.length; i++) {
            const slot = this.pool[i];

            if (slot.activeJobs < lowestLoad) {
                lowestLoad = slot.activeJobs;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    private handleMessage(
        workerIndex: number,
        message: WorkerResponse
    ): void {
        if (message.type === "ready") {
            return;
        }

        const request = this.pendingRequests.get(message.requestId);
        const slot = this.pool[workerIndex];

        if (slot) {
            slot.assignedRequestIds.delete(message.requestId);
            slot.activeJobs = Math.max(0, slot.activeJobs - 1);
        }

        if (!request) {
            return;
        }

        this.pendingRequests.delete(message.requestId);

        if (message.type === "generated") {
            request.resolve(message.chunk);
            return;
        }

        if (message.type === "error") {
            request.reject(new Error(message.error));
        }
    }

    private handleWorkerError(
        workerIndex: number,
        event: ErrorEvent
    ): void {
        const slot = this.pool[workerIndex];
        const errorMessage = event.message || "Unknown chunk worker error.";
        const error = new Error(`Worker #${workerIndex} error: ${errorMessage}`);

        if (slot) {
            for (const reqId of slot.assignedRequestIds) {
                const req = this.pendingRequests.get(reqId);
                if (req) {
                    this.pendingRequests.delete(reqId);
                    req.reject(error);
                }
            }

            slot.assignedRequestIds.clear();
            slot.activeJobs = 0;

            /*
             * Recrear el worker fallido para que el pool mantenga su capacidad.
             */
            try {
                slot.worker.terminate();
                const replacement = this.createWorkerSlot(workerIndex);
                this.pool[workerIndex] = replacement;
            } catch (recreateError) {
                console.error("Failed to recreate worker in pool:", recreateError);
            }
        }
    }
}