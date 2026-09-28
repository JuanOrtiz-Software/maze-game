import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";

import { WorldConfig } from "./types/WorldTypes";

import { WorldGenerator } from "./WorldGenerator";

interface PreloadCandidate {
    coordinates: ChunkCoordinates;
    distance: number;
}

export class ChunkManager {
    private readonly config: WorldConfig;

    private readonly worldGenerator: WorldGenerator;

    /**
     * Chunks actualmente almacenados en memoria.
     */
    private readonly loadedChunks:
        Map<string, Chunk>;

    /**
     * Chunks pendientes de generación.
     */
    private preloadQueue:
        ChunkCoordinates[] = [];

    /**
     * Evita meter dos veces el mismo chunk
     * en la cola.
     */
    private readonly queuedChunks:
        Set<string>;

    /**
     * Chunk donde actualmente se encuentra
     * el jugador.
     */
    private currentChunk:
        ChunkCoordinates | null = null;

    constructor(
        config: WorldConfig,
        worldGenerator: WorldGenerator
    ) {
        this.config =
            config;

        this.worldGenerator =
            worldGenerator;

        this.loadedChunks =
            new Map();

        this.queuedChunks =
            new Set();
    }

    /**
     * Actualiza el chunk actual del jugador.
     */
    public updatePlayerChunk(
        playerChunk: ChunkCoordinates
    ): void {
        /*
         * Si seguimos en el mismo chunk,
         * no necesitamos reconstruir la cola.
         */
        if (
            this.currentChunk !== null &&
            this.isSameCoordinates(
                this.currentChunk,
                playerChunk
            )
        ) {
            return;
        }

        this.currentChunk = {
            x: playerChunk.x,
            y: playerChunk.y,
        };

        /*
         * El chunk actual SIEMPRE debe estar
         * disponible inmediatamente.
         */
        this.ensureChunkLoaded(
            this.currentChunk
        );

        /*
         * Creamos la nueva cola de precarga.
         */
        this.rebuildPreloadQueue();

        /*
         * Eliminamos solamente chunks que
         * están demasiado lejos.
         */
        this.unloadDistantChunks();
    }

    /**
     * Genera algunos chunks pendientes.
     *
     * Debe ejecutarse desde GameScene.update().
     */
    public processPreloadQueue(): void {
        /*
         * Máximo de chunks generados
         * por frame en el hilo principal.
         *
         * Evita congelar el hilo mientras
         * se precargan chunks alrededor
         * del jugador.
         */
        const CHUNKS_PER_FRAME = 3;

        let generated = 0;

        while (
            this.preloadQueue.length > 0 &&
            generated < CHUNKS_PER_FRAME
        ) {
            const coordinates =
                this.preloadQueue.shift();

            if (!coordinates) {
                break;
            }

            const key =
                this.createChunkKey(
                    coordinates
                );

            this.queuedChunks.delete(
                key
            );

            /*
             * Puede que ya haya sido generado
             * mientras tanto.
             */
            if (
                this.loadedChunks.has(key)
            ) {
                continue;
            }

            this.loadChunk(
                coordinates
            );

            generated++;
        }
    }

    /**
     * Devuelve todos los chunks actualmente
     * almacenados en memoria.
     */
    public getLoadedChunks(): Chunk[] {
        return Array.from(
            this.loadedChunks.values()
        );
    }

    /**
     * Obtiene un chunk concreto.
     */
    public getChunk(
        coordinates: ChunkCoordinates
    ): Chunk | undefined {
        return this.loadedChunks.get(
            this.createChunkKey(
                coordinates
            )
        );
    }

    /**
     * Indica si un chunk ya fue generado.
     */
    public hasChunk(
        coordinates: ChunkCoordinates
    ): boolean {
        return this.loadedChunks.has(
            this.createChunkKey(
                coordinates
            )
        );
    }

    /**
     * Indica cuántos chunks faltan
     * por precargar.
     */
    public getPendingChunkCount(): number {
        return this.preloadQueue.length;
    }

    /**
     * Indica cuántos chunks tenemos
     * actualmente en memoria.
     */
    public getLoadedChunkCount(): number {
        return this.loadedChunks.size;
    }

    /**
     * Comprueba si ya terminó la precarga.
     */
    public isPreloadComplete(): boolean {
        return (
            this.preloadQueue.length === 0
        );
    }

    /**
     * Limpia todo el mundo cargado.
     */
    public clear(): void {
        this.loadedChunks.clear();

        this.preloadQueue = [];

        this.queuedChunks.clear();

        this.currentChunk = null;
    }

    /**
     * Garantiza que un chunk exista inmediatamente.
     */
    private ensureChunkLoaded(
        coordinates: ChunkCoordinates
    ): void {
        const key =
            this.createChunkKey(
                coordinates
            );

        if (
            this.loadedChunks.has(key)
        ) {
            return;
        }

        this.loadChunk(
            coordinates
        );
    }

    /**
     * Genera un chunk y lo guarda en caché.
     */
    private loadChunk(
        coordinates: ChunkCoordinates
    ): void {
        const key =
            this.createChunkKey(
                coordinates
            );

        if (
            this.loadedChunks.has(key)
        ) {
            return;
        }

        const chunk =
            this.worldGenerator.generateChunk(
                coordinates
            );

        this.loadedChunks.set(
            key,
            chunk
        );
    }

    /**
     * Construye la cola de chunks
     * que deben precargarse.
     */
    private rebuildPreloadQueue(): void {
        if (
            this.currentChunk === null
        ) {
            return;
        }

        const candidates:
            PreloadCandidate[] = [];

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
                    x:
                        this.currentChunk.x +
                        x,

                    y:
                        this.currentChunk.y +
                        y,
                };

                const key =
                    this.createChunkKey(
                        coordinates
                    );

                /*
                 * Ya está generado.
                 */
                if (
                    this.loadedChunks.has(key)
                ) {
                    continue;
                }

                /*
                 * Ya está esperando
                 * en la cola.
                 */
                if (
                    this.queuedChunks.has(key)
                ) {
                    continue;
                }

                const candidateDistance =
                    Math.abs(x) +
                    Math.abs(y);

                candidates.push({
                    coordinates,
                    distance:
                        candidateDistance,
                });
            }
        }

        /*
         * Primero los chunks más cercanos.
         */
        candidates.sort(
            (a, b) =>
                a.distance -
                b.distance
        );

        for (
            const candidate
            of candidates
        ) {
            const key =
                this.createChunkKey(
                    candidate.coordinates
                );

            this.preloadQueue.push(
                candidate.coordinates
            );

            this.queuedChunks.add(
                key
            );
        }
    }

    /**
     * Elimina chunks que ya están
     * demasiado lejos del jugador.
     */
    private unloadDistantChunks(): void {
        if (
            this.currentChunk === null
        ) {
            return;
        }

        const unloadDistance =
            this.config.unloadDistance;

        for (
            const [
                key,
                chunk
            ]
            of this.loadedChunks
        ) {
            const distanceX =
                Math.abs(
                    chunk.coordinates.x -
                    this.currentChunk.x
                );

            const distanceY =
                Math.abs(
                    chunk.coordinates.y -
                    this.currentChunk.y
                );

            /*
             * Usamos distancia Chebyshev:
             *
             * max(dx, dy)
             *
             * porque nuestro mundo se precarga
             * formando un cuadrado.
             */
            const distance =
                Math.max(
                    distanceX,
                    distanceY
                );

            if (
                distance >
                unloadDistance
            ) {
                this.loadedChunks.delete(
                    key
                );
            }
        }
    }

    private createChunkKey(
        coordinates: ChunkCoordinates
    ): string {
        return `${coordinates.x},${coordinates.y}`;
    }

    private isSameCoordinates(
        first: ChunkCoordinates,
        second: ChunkCoordinates
    ): boolean {
        return (
            first.x === second.x &&
            first.y === second.y
        );
    }
}