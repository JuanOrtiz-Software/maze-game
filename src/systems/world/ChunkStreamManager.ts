import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";

import { WorldConfig } from "./types/WorldTypes";

import { ChunkWorkerClient } from "./ChunkWorkerClient";
import { WorldGenerator } from "./WorldGenerator";

export type ChunkPriority =
    | 0
    | 1
    | 2
    | 3
    | 4;

interface ChunkRecord {
    coordinates: ChunkCoordinates;

    chunk: Chunk;

    lastAccess: number;
}

interface QueueEntry {
    coordinates: ChunkCoordinates;

    key: string;

    priority: ChunkPriority;

    sequence: number;

    resolve: (chunk: Chunk) => void;

    reject: (error: Error) => void;
}

export class ChunkStreamManager {
    private readonly config: WorldConfig;

    private readonly workerClient:
        ChunkWorkerClient;

    /**
     * Generador síncrono de fallback exclusivo para create().
     *
     * Se usa ÚNICAMENTE para garantizar que el
     * chunk inicial (0,0) esté disponible de inmediato
     * en el frame 0 antes de que el Worker haya respondido.
     *
     * NUNCA se llama durante una transición.
     */
    private readonly worldGenerator:
        WorldGenerator;

    private readonly cache:
        Map<string, ChunkRecord>;

    private readonly pending:
        Map<string, Promise<Chunk>>;

    private queue:
        QueueEntry[];

    private sequence = 0;

    private frameCounter = 0;

    private destroyed = false;

    constructor(
        config: WorldConfig
    ) {
        this.config = config;

        this.workerClient =
            new ChunkWorkerClient(config);

        this.worldGenerator =
            new WorldGenerator(config);

        this.cache = new Map();

        this.pending = new Map();

        this.queue = [];
    }

    /**
     * Garantiza que el chunk inicial esté en cache
     * de forma síncrona.
     *
     * Solo debe llamarse durante GameScene.create(),
     * NUNCA durante una transición.
     */
    public ensureInitialChunk(
        coordinates: ChunkCoordinates
    ): Chunk {
        const key =
            this.createKey(coordinates);

        const existing =
            this.cache.get(key);

        if (existing) {
            existing.lastAccess =
                this.frameCounter;

            return existing.chunk;
        }

        /*
         * Fallback síncrono:
         * solo para el chunk de arranque si el worker aún no completó.
         */
        const chunk =
            this.worldGenerator.generateChunk(
                coordinates
            );

        this.cache.set(
            key,
            {
                coordinates,
                chunk,
                lastAccess: this.frameCounter,
            }
        );

        return chunk;
    }

    /**
     * Solicita un chunk con una prioridad.
     *
     * Si ya existe en cache, devuelve inmediatamente el dato.
     * Si ya está pendiente, actualiza su prioridad si la nueva es más alta.
     */
    public requestChunk(
        coordinates: ChunkCoordinates,
        priority: ChunkPriority = 0
    ): Promise<Chunk> {
        if (this.destroyed) {
            return Promise.reject(
                new Error(
                    "ChunkStreamManager has been destroyed."
                )
            );
        }

        const key =
            this.createKey(
                coordinates
            );

        /*
         * CACHE HIT
         */
        const cached =
            this.cache.get(key);

        if (cached) {
            cached.lastAccess =
                this.frameCounter;

            return Promise.resolve(
                cached.chunk
            );
        }

        /*
         * REQUEST DUPLICADA / YA EN COLA
         */
        const existing =
            this.pending.get(key);

        if (existing) {
            const queuedEntry = this.queue.find(e => e.key === key);
            if (queuedEntry && priority < queuedEntry.priority) {
                queuedEntry.priority = priority;
                this.sortQueue();
            }

            return existing;
        }

        /*
         * Nueva solicitud.
         */
        const promise =
            new Promise<Chunk>(
                (
                    resolve,
                    reject
                ) => {
                    this.queue.push({
                        coordinates: {
                            x: coordinates.x,
                            y: coordinates.y,
                        },

                        key,

                        priority,

                        sequence:
                            this.sequence++,

                        resolve,

                        reject,
                    });

                    this.sortQueue();

                    this.processQueue();
                }
            );

        this.pending.set(
            key,
            promise
        );

        return promise;
    }

    /**
     * Precarga chunks alrededor del centro indicado.
     *
     * No bloquea el hilo principal ni usa await.
     */
    public preloadAround(
        center: ChunkCoordinates
    ): void {
        const distance =
            this.config.preloadDistance;

        for (
            let y = -distance;
            y <= distance;
            y++
        ) {
            for (
                let x = -distance;
                x <= distance;
                x++
            ) {
                const coordinates = {
                    x: center.x + x,
                    y: center.y + y,
                };

                const priority =
                    this.calculatePriority(
                        x,
                        y
                    );

                this.requestChunk(
                    coordinates,
                    priority
                ).catch(() => {
                    // Errores de precarga o cancelaciones no rompen la ejecución
                });
            }
        }
    }

    /**
     * Devuelve un chunk si ya está generado en cache.
     * NUNCA genera de forma síncrona.
     */
    public getChunk(
        coordinates: ChunkCoordinates
    ): Chunk | undefined {
        const key =
            this.createKey(
                coordinates
            );

        const record =
            this.cache.get(key);

        if (!record) {
            return undefined;
        }

        record.lastAccess =
            this.frameCounter;

        return record.chunk;
    }

    /**
     * Comprueba si un chunk existe en cache.
     */
    public hasChunk(
        coordinates: ChunkCoordinates
    ): boolean {
        return this.cache.has(
            this.createKey(
                coordinates
            )
        );
    }

    /**
     * Comprueba si un chunk está siendo generado o en cola.
     */
    public isGenerating(
        coordinates: ChunkCoordinates
    ): boolean {
        return this.pending.has(
            this.createKey(
                coordinates
            )
        );
    }

    /**
     * Número de chunks en cache.
     */
    public getLoadedCount(): number {
        return this.cache.size;
    }

    /**
     * Número de solicitudes pendientes en cola y en workers.
     */
    public getPendingCount(): number {
        return this.pending.size;
    }

    /**
     * Actualización del contador interno de frames (LRU).
     */
    public update(): void {
        this.frameCounter++;
    }

    /**
     * Elimina chunks del cache y cancela solicitudes en cola
     * fuera del radio de descarga respecto al centro actual.
     */
    public unloadDistantChunks(
        center: ChunkCoordinates
    ): void {
        const distance =
            this.config.unloadDistance;

        for (
            const [
                key,
                record,
            ]
            of this.cache
        ) {
            const dx =
                Math.abs(
                    record.coordinates.x -
                    center.x
                );

            const dy =
                Math.abs(
                    record.coordinates.y -
                    center.y
                );

            const chunkDistance =
                Math.max(
                    dx,
                    dy
                );

            if (
                chunkDistance >
                distance
            ) {
                this.cache.delete(
                    key
                );
            }
        }

        /*
         * Cancelar también chunks en cola que quedaron obsoletos por distancia
         */
        const remainingQueue: QueueEntry[] = [];

        for (const entry of this.queue) {
            const dx = Math.abs(entry.coordinates.x - center.x);
            const dy = Math.abs(entry.coordinates.y - center.y);
            const chunkDistance = Math.max(dx, dy);

            if (chunkDistance > distance) {
                this.pending.delete(entry.key);
                entry.reject(new Error("Preload cancelled: chunk out of range."));
            } else {
                remainingQueue.push(entry);
            }
        }

        this.queue = remainingQueue;
    }

    /**
     * Libera todos los recursos y workers.
     */
    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        for (
            const entry
            of this.queue
        ) {
            entry.reject(
                new Error(
                    "Chunk stream destroyed."
                )
            );
        }

        this.queue.length = 0;

        this.cache.clear();
        this.pending.clear();

        this.workerClient.destroy();
    }

    private processQueue(): void {
        if (this.destroyed) {
            return;
        }

        /*
         * Despachar a los workers mientras haya trabajo en cola
         * Y el pool de workers tenga capacidad disponible.
         */
        while (
            this.queue.length > 0 &&
            this.workerClient.hasAvailableWorker()
        ) {
            const entry =
                this.queue.shift();

            if (!entry) {
                break;
            }

            this.workerClient
                .generateChunk(
                    entry.coordinates
                )
                .then(
                    chunk => {
                        this.pending.delete(
                            entry.key
                        );

                        this.cache.set(
                            entry.key,
                            {
                                coordinates:
                                    entry.coordinates,

                                chunk,

                                lastAccess:
                                    this.frameCounter,
                            }
                        );

                        entry.resolve(
                            chunk
                        );

                        /*
                         * Continuar procesando la cola con el worker liberado
                         */
                        this.processQueue();
                    }
                )
                .catch(
                    error => {
                        this.pending.delete(
                            entry.key
                        );

                        entry.reject(
                            error instanceof Error
                                ? error
                                : new Error(
                                    String(error)
                                )
                        );

                        this.processQueue();
                    }
                );
        }
    }

    private sortQueue(): void {
        this.queue.sort(
            (
                first,
                second
            ) => {
                if (
                    first.priority !==
                    second.priority
                ) {
                    return (
                        first.priority -
                        second.priority
                    );
                }

                return (
                    first.sequence -
                    second.sequence
                );
            }
        );
    }

    private calculatePriority(
        offsetX: number,
        offsetY: number
    ): ChunkPriority {
        const distance =
            Math.max(
                Math.abs(offsetX),
                Math.abs(offsetY)
            );

        if (distance === 0) {
            return 0;
        }

        if (distance === 1) {
            return 1;
        }

        if (distance === 2) {
            return 2;
        }

        if (distance <= 3) {
            return 3;
        }

        return 4;
    }

    private createKey(
        coordinates: ChunkCoordinates
    ): string {
        return `${coordinates.x},${coordinates.y}`;
    }
}