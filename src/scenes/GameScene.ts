import Phaser from "phaser";

import { Player } from "../entities/Player";
import { EnemySystem } from "../systems/EnemySystem";

import { WorldConfigFactory } from "../systems/world/WorldConfigFactory";
import { ChunkStreamManager } from "../systems/world/ChunkStreamManager";
import { MazeRenderer } from "../systems/world/MazeRenderer";

import { CollisionSystem } from "../systems/CollisionSystem";

import { Chunk } from "../systems/world/types/ChunkTypes";

export class GameScene extends Phaser.Scene {
    /*
     * =========================
     * GAME OBJECTS
     * =========================
     */

    private title!: Phaser.GameObjects.Text;
    private subtitle!: Phaser.GameObjects.Text;

    private player!: Player;
    private enemySystem!: EnemySystem;

    /*
     * =========================
     * WORLD
     * =========================
     */

    private chunkStreamManager!: ChunkStreamManager;

    private mazeRenderer!: MazeRenderer;
    private collisionSystem!: CollisionSystem;

    /*
     * =========================
     * CURRENT CHUNK
     * =========================
     */

    private currentChunk!: Chunk;

    private worldConfig: any;
    private lastPlayerChunk: { x: number; y: number } | null = null;
    private renderedChunks: Set<string> = new Set();
    
    private currentOffset!: {
        x: number;
        y: number;
    };

    private tileSize!: number;

    constructor() {
        super("GameScene");
    }

    /*
     * ============================================================
     * CREATE
     * ============================================================
     */

    create(): void {
        /*
         * =========================
         * WORLD CONFIG
         * =========================
         */

        this.worldConfig =
            WorldConfigFactory.create(
                this.scale.width,
                this.scale.height,
                928371
            );

        this.tileSize =
            this.worldConfig.tileSize;

        /*
         * =========================
         * CHUNK STREAM MANAGER
         * =========================
         *
         * Único punto de acceso al sistema
         * de generación de chunks.
         *
         * Gestiona el pool de Workers,
         * el cache y las prioridades de carga.
         */

        this.chunkStreamManager =
            new ChunkStreamManager(
                this.worldConfig
            );

        /*
         * =========================
         * SISTEMAS
         * =========================
         */

        this.mazeRenderer =
            new MazeRenderer(this);

        this.collisionSystem =
            new CollisionSystem(this);

        /*
         * =========================
         * CHUNK INICIAL
         * =========================
         *
         * Solicitamos el chunk (0,0) con
         * máxima prioridad y arrancamos
         * la precarga alrededor de él.
         *
         * REGLA: GameScene nunca debe generar
         * un chunk durante una transición.
         * Solo durante create() se puede
         * inicializar sincrónicamente.
         */

        this.chunkStreamManager.preloadAround({
            x: 0,
            y: 0,
        });

        /*
         * El chunk inicial debe estar disponible
         * de inmediato antes de que el jugador
         * empiece a moverse.
         *
         * ensureInitialChunk() garantiza esto:
         * - Si el Worker ya respondió: usa el cache.
         * - Si no: genera sincrónicamente como fallback.
         *
         * Esto es lo ÚNICO que puede ocurrir de forma
         * síncrona. Las transiciones posteriores
         * SOLO usan getChunk() del cache.
         */
        const initialChunk =
            this.chunkStreamManager.ensureInitialChunk({
                x: 0,
                y: 0,
            });

        this.currentChunk =
            initialChunk;

        /*
         * =========================
         * RENDER DEL CHUNK
         * =========================
         */

        this.mazeRenderer.render(
            this.currentChunk,
            this.tileSize
        );

        this.currentOffset = { x: 0, y: 0 };

        this.createPlayer();
        this.cameras.main.startFollow(this.player, true, 1, 1);
        this.cameras.main.setZoom(1);

        /*
         * =========================
         * ENEMY SYSTEM
         * =========================
         */

        this.enemySystem =
            new EnemySystem(
                this,
                this.player
            );

        /*
         * =========================
         * COLISIONES
         * =========================
         */

        this.setupCollisions();

        /*
         * =========================
         * ENEMIGOS DEL CHUNK INICIAL
         * =========================
         */

        this.spawnEnemyForCurrentChunk();

        /*
         * =========================
         * UI
         * =========================
         */

        this.title =
            this.add.text(
                40,
                40,
                "MAZE GAME",
                {
                    fontSize: "32px",
                    color: "#ffffff",
                }
            );

        this.title.setDepth(100);

        this.subtitle =
            this.add.text(
                40,
                85,
                "Laberinto procedural",
                {
                    fontSize: "18px",
                    color: "#aaaaaa",
                }
            );

        this.subtitle.setDepth(100);

        /*
         * =========================
         * RESIZE INICIAL
         * =========================
         */

        this.resizeGame();

        this.scale.on(
            "resize",
            this.resizeGame,
            this
        );

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            () => {
                this.scale.off(
                    "resize",
                    this.resizeGame,
                    this
                );

                this.chunkStreamManager.destroy();
                this.collisionSystem.destroy();
                this.mazeRenderer.destroy();
            }
        );
    }

    /*
     * ============================================================
     * UPDATE
     * ============================================================
     */

    update(
        time: number,
        delta: number
    ): void {
        if (!this.player) {
            return;
        }

        this.player.update();
        this.chunkStreamManager.update();

        const cw = this.worldConfig.chunkWidth * this.tileSize;
        const ch = this.worldConfig.chunkHeight * this.tileSize;

        const currentChunkX = Math.floor(this.player.x / cw);
        const currentChunkY = Math.floor(this.player.y / ch);

        if (!this.lastPlayerChunk || this.lastPlayerChunk.x !== currentChunkX || this.lastPlayerChunk.y !== currentChunkY) {
            this.lastPlayerChunk = { x: currentChunkX, y: currentChunkY };
            
            this.chunkStreamManager.preloadAround(this.lastPlayerChunk);
            this.chunkStreamManager.unloadDistantChunks(this.lastPlayerChunk);
            
            const centerChunk = this.chunkStreamManager.getChunk(this.lastPlayerChunk);
            if (centerChunk) {
                this.currentChunk = centerChunk;
                this.currentOffset = { x: currentChunkX * cw, y: currentChunkY * ch };
                this.spawnEnemyForCurrentChunk();
            }
        }

        const visibleKeys = new Set<string>();
        const renderDist = 1;
        let newChunksThisFrame = 0;
        const maxNewChunksPerFrame = 1;

        // Primero: siempre renderizar el chunk del jugador sin throttle
        const centerKey = `${currentChunkX},${currentChunkY}`;
        visibleKeys.add(centerKey);
        if (!this.renderedChunks.has(centerKey)) {
            const centerChunkData = this.chunkStreamManager.getChunk({x: currentChunkX, y: currentChunkY});
            if (centerChunkData) {
                this.mazeRenderer.render(centerChunkData, this.tileSize);
                this.collisionSystem.buildWalls(centerChunkData, this.tileSize);
                this.renderedChunks.add(centerKey);
            }
        }

        // Luego: renderizar vecinos con throttle (máx 1 por frame)
        for (let y = -renderDist; y <= renderDist; y++) {
            for (let x = -renderDist; x <= renderDist; x++) {
                const cx = currentChunkX + x;
                const cy = currentChunkY + y;
                const key = `${cx},${cy}`;
                visibleKeys.add(key);

                if (!this.renderedChunks.has(key) && newChunksThisFrame < maxNewChunksPerFrame) {
                    const chunk = this.chunkStreamManager.getChunk({x: cx, y: cy});
                    if (chunk) {
                        this.mazeRenderer.render(chunk, this.tileSize);
                        this.collisionSystem.buildWalls(chunk, this.tileSize);
                        this.renderedChunks.add(key);
                        newChunksThisFrame++;
                    }
                }
            }
        }

        for (const key of this.renderedChunks) {
            if (!visibleKeys.has(key)) {
                const [cx, cy] = key.split(',').map(Number);
                this.mazeRenderer.removeChunk({x: cx, y: cy});
                this.collisionSystem.removeChunk({x: cx, y: cy});
                this.renderedChunks.delete(key);
            }
        }

        if (this.enemySystem) {
            this.enemySystem.update(time, delta);
        }
    }

    /*
     * ============================================================
     * CREATE PLAYER
     * ============================================================
     */

    private createPlayer(): void {
        const start =
            this.currentChunk.maze.start;

        const playerX =
            start.x * this.tileSize +
            this.tileSize / 2;

        const playerY =
            start.y * this.tileSize +
            this.tileSize / 2;

        this.player =
            new Player(
                this,
                playerX,
                playerY
            );

        this.player.setDepth(50);

        /*
         * Configurar cuerpo físico.
         */
        this.collisionSystem.configurePlayer(
            this.player,
            this.tileSize
        );
    }

    /*
     * ============================================================
     * COLLISIONS
     * ============================================================
     */

    private setupCollisions(): void {

        /*
         * Construir paredes físicas
         * del chunk actual.
         */
        this.collisionSystem.buildWalls(
            this.currentChunk,
            this.tileSize
        );

        /*
         * Conectar jugador
         * con las paredes.
         */
        this.collisionSystem.addActor(
            this.player
        );
    }

    /*
     * ============================================================
     * ENEMY SYSTEM
     * ============================================================
     */

    private spawnEnemyForCurrentChunk(): void {
        this.enemySystem.setChunk(
            this.currentChunk,
            this.tileSize,
            this.currentOffset
        );
    }

    /*
     * ============================================================
     * RESIZE
     * ============================================================
     */

    private resizeGame(): void {

        /*
         * =========================
         * UI
         * =========================
         */

        this.title.setPosition(
            40,
            40
        );

        this.subtitle.setPosition(
            40,
            85
        );
    }
}

export default GameScene;