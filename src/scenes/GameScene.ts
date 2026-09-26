import Phaser from "phaser";

import { Player } from "../entities/Player";

import { WorldConfigFactory } from "../systems/world/WorldConfigFactory";
import { WorldGenerator } from "../systems/world/WorldGenerator";
import { ChunkManager } from "../systems/world/ChunkManager";
import { MazeRenderer } from "../systems/world/MazeRenderer";

import { CollisionSystem } from "../systems/CollisionSystem";

import {
    ChunkTransitionSystem,
    ChunkTransitionDirection,
} from "../systems/world/ChunkTransitionSystem";

import { Chunk } from "../systems/world/types/ChunkTypes";

export class GameScene extends Phaser.Scene {
    private ground!: Phaser.GameObjects.Image;

    private title!: Phaser.GameObjects.Text;
    private subtitle!: Phaser.GameObjects.Text;

    private player!: Player;

    private worldGenerator!: WorldGenerator;
    private chunkManager!: ChunkManager;

    private mazeRenderer!: MazeRenderer;

    private collisionSystem!: CollisionSystem;

    private chunkTransitionSystem!: ChunkTransitionSystem;

    private currentChunk!: Chunk;

    private tileSize!: number;

    constructor() {
        super("GameScene");
    }

    create(): void {
        /*
         * =========================
         * FONDO
         * =========================
         */

        this.ground =
            this.add.image(
                0,
                0,
                "ground"
            );

        this.ground.setOrigin(
            0.5,
            0.5
        );

        this.ground.setDepth(-10);

        /*
         * =========================
         * WORLD
         * =========================
         */

        const worldConfig =
            WorldConfigFactory.create(
                this.scale.width,
                this.scale.height,
                928371
            );

        this.tileSize =
            worldConfig.tileSize;

        this.worldGenerator =
            new WorldGenerator(
                worldConfig
            );

        this.chunkManager =
            new ChunkManager(
                worldConfig,
                this.worldGenerator
            );

        this.mazeRenderer =
            new MazeRenderer(this);

        this.collisionSystem =
            new CollisionSystem(this);

        this.chunkTransitionSystem =
            new ChunkTransitionSystem();

        /*
         * =========================
         * CHUNK INICIAL
         * =========================
         */

        this.chunkManager.updatePlayerChunk({
            x: 0,
            y: 0,
        });

        const initialChunk =
            this.chunkManager.getChunk({
                x: 0,
                y: 0,
            });

        if (!initialChunk) {
            throw new Error(
                "Initial chunk could not be generated."
            );
        }

        this.currentChunk =
            initialChunk;

        /*
         * =========================
         * RENDER DEL LABERINTO
         * =========================
         */

        this.mazeRenderer.render(
            this.currentChunk,
            this.tileSize
        );

        /*
         * =========================
         * PLAYER
         * =========================
         */

        this.createPlayer();

        /*
         * =========================
         * COLISIONES
         * =========================
         */

        this.setupCollisions();

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
         * RESIZE
         * =========================
         */

        this.resizeGame();

        this.scale.on(
            "resize",
            this.resizeGame,
            this
        );
    }

    update(): void {
        if (!this.player) {
            return;
        }

        /*
         * Movimiento del jugador.
         */
        this.player.update();

        /*
         * Comprobar si atravesó
         * una conexión del chunk.
         */
        const transition =
            this.chunkTransitionSystem.detectTransition(
                this.player,
                this.currentChunk,
                this.mazeRenderer.getOffset(
                    this.currentChunk,
                    this.tileSize
                ),
                this.tileSize
            );

        if (transition) {
            this.changeChunk(
                transition.direction,
                transition.targetChunk
            );
        }
    }

    private createPlayer(): void {
        const offset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        const start =
            this.currentChunk.maze.start;

        const playerX =
            offset.x +
            start.x * this.tileSize +
            this.tileSize / 2;

        const playerY =
            offset.y +
            start.y * this.tileSize +
            this.tileSize / 2;

        this.player =
            new Player(
                this,
                playerX,
                playerY
            );

        this.player.setDepth(50);

        this.collisionSystem.configurePlayer(
            this.player,
            this.tileSize
        );
    }

    private setupCollisions(): void {
        const offset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        this.collisionSystem.buildWalls(
            this.currentChunk,
            this.tileSize,
            offset
        );

        this.collisionSystem.addActor(
            this.player
        );
    }

    private changeChunk(
        direction: ChunkTransitionDirection,
        targetCoordinates: {
            x: number;
            y: number;
        }
    ): void {
        /*
         * Detener al jugador antes
         * de cambiar de mundo.
         */
        const body =
            this.player.body;

        if (
            body &&
            body instanceof Phaser.Physics.Arcade.Body
        ) {
            body.setVelocity(0, 0);
        }

        /*
         * Pedimos al ChunkManager
         * que cargue el nuevo chunk.
         */
        this.chunkManager.updatePlayerChunk(
            targetCoordinates
        );

        const nextChunk =
            this.chunkManager.getChunk(
                targetCoordinates
            );

        if (!nextChunk) {
            throw new Error(
                "Target chunk could not be generated."
            );
        }

        /*
         * Actualizar chunk actual.
         */
        this.currentChunk =
            nextChunk;

        /*
         * Limpiar las colisiones
         * del chunk anterior.
         */
        this.collisionSystem.clearWalls();

        /*
         * Dibujar nuevo chunk.
         */
        this.mazeRenderer.render(
            this.currentChunk,
            this.tileSize
        );

        /*
         * Colocar al jugador en
         * la entrada correspondiente.
         */
        this.placePlayerAtEntry(
            direction
        );

        /*
         * Crear las nuevas paredes físicas.
         */
        this.setupCollisions();
    }

    private placePlayerAtEntry(
        direction: ChunkTransitionDirection
    ): void {
        const offset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        const grid =
            this.currentChunk.maze.grid;

        const width =
            grid[0].length;

        const height =
            grid.length;

        let x: number;
        let y: number;

        switch (direction) {
            case "east":
                /*
                 * Entramos por el WEST
                 * del nuevo chunk.
                 */
                x =
                    offset.x +
                    this.tileSize * 1.5;

                y =
                    offset.y +
                    this.currentChunk
                        .connections
                        .west
                        .position *
                    this.tileSize +
                    this.tileSize / 2;

                break;

            case "west":
                /*
                 * Entramos por el EAST.
                 */
                x =
                    offset.x +
                    (width - 1.5) *
                    this.tileSize;

                y =
                    offset.y +
                    this.currentChunk
                        .connections
                        .east
                        .position *
                    this.tileSize +
                    this.tileSize / 2;

                break;

            case "south":
                /*
                 * Entramos por el NORTH.
                 */
                x =
                    offset.x +
                    this.currentChunk
                        .connections
                        .north
                        .position *
                    this.tileSize +
                    this.tileSize / 2;

                y =
                    offset.y +
                    this.tileSize * 1.5;

                break;

            case "north":
                /*
                 * Entramos por el SOUTH.
                 */
                x =
                    offset.x +
                    this.currentChunk
                        .connections
                        .south
                        .position *
                    this.tileSize +
                    this.tileSize / 2;

                y =
                    offset.y +
                    (height - 1.5) *
                    this.tileSize;

                break;
        }

        this.player.setPosition(
            x,
            y
        );

        const body =
            this.player.body;

        if (
            body &&
            body instanceof Phaser.Physics.Arcade.Body
        ) {
            body.updateFromGameObject();
            body.setVelocity(0, 0);
        }
    }

    private resizeGame(): void {
        const width =
            this.scale.width;

        const height =
            this.scale.height;

        /*
         * Guardamos la posición del jugador
         * relativa al chunk.
         */
        let localX: number | null = null;
        let localY: number | null = null;

        if (this.player) {
            const oldOffset =
                this.mazeRenderer.getOffset(
                    this.currentChunk,
                    this.tileSize
                );

            localX =
                this.player.x -
                oldOffset.x;

            localY =
                this.player.y -
                oldOffset.y;
        }

        /*
         * Fondo.
         */
        this.ground.setPosition(
            width / 2,
            height / 2
        );

        const source =
            this.textures
                .get("ground")
                .getSourceImage();

        const scaleX =
            width / source.width;

        const scaleY =
            height / source.height;

        const scale =
            Math.max(
                scaleX,
                scaleY
            );

        this.ground.setScale(
            scale
        );

        /*
         * Redibujar el chunk
         * en su nueva posición.
         */
        this.mazeRenderer.render(
            this.currentChunk,
            this.tileSize
        );

        const newOffset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        /*
         * Restaurar la posición relativa
         * del jugador.
         */
        if (
            this.player &&
            localX !== null &&
            localY !== null
        ) {
            this.player.setPosition(
                newOffset.x + localX,
                newOffset.y + localY
            );

            const body =
                this.player.body;

            if (
                body &&
                body instanceof Phaser.Physics.Arcade.Body
            ) {
                body.updateFromGameObject();
            }
        }

        /*
         * Reconstruir cuerpos físicos
         * porque el chunk cambió de posición.
         */
        if (this.player) {
            this.setupCollisions();
        }

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