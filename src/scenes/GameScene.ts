import Phaser from "phaser";

import { Player } from "../entities/Player";
import { EnemySystem } from "../systems/EnemySystem";

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
    private enemySystem!: EnemySystem;

    private worldGenerator!: WorldGenerator;
    private chunkManager!: ChunkManager;

    private mazeRenderer!: MazeRenderer;

    private collisionSystem!: CollisionSystem;

    private chunkTransitionSystem!: ChunkTransitionSystem;

    private currentChunk!: Chunk;

    private currentOffset!: {
        x: number;
        y: number;
    };

    private isTransitioning = false;

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

        this.currentOffset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        /*
         * =========================
         * PLAYER
         * =========================
         */

        this.createPlayer();

        this.enemySystem = new EnemySystem(
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

    update(time: number, delta: number): void {
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
                this.currentOffset,
                this.tileSize
            );

        if (transition) {
            this.changeChunk(
                transition.direction,
                transition.targetChunk
            );
        }

        this.enemySystem.update(time, delta);
    }

    private createPlayer(): void {
        const offset = this.currentOffset;

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
        const offset = this.currentOffset;

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
        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;

        try {
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
         * Dibujar nuevo chunk.
         */
        this.mazeRenderer.render(
            this.currentChunk,
            this.tileSize
        );

        this.currentOffset =
            this.mazeRenderer.getOffset(
                this.currentChunk,
                this.tileSize
            );

        /*
         * Crear las nuevas paredes físicas.
         */
        this.setupCollisions();

        /*
         * Colocar al jugador en una celda
         * transitable después de crear los colliders.
         */
        this.placePlayerAtEntry(
            direction
        );

        this.spawnEnemyForCurrentChunk();
        } finally {
            this.isTransitioning = false;
        }
    }

    private spawnEnemyForCurrentChunk(): void {
        this.enemySystem.setChunk(
            this.currentChunk,
            this.tileSize,
            this.currentOffset
        );
    }

    private placePlayerAtEntry(
        direction: ChunkTransitionDirection
    ): void {
        const offset = this.currentOffset;

        const grid = this.currentChunk.maze.grid;
        const width = grid[0].length;
        const height = grid.length;

        let cellX: number;
        let cellY: number;

        switch (direction) {
            case "east":
                /*
                 * Entramos por el WEST
                 * del nuevo chunk.
                 */
                cellX = 1;
                cellY = this.currentChunk.connections.west.position;

                break;

            case "west":
                /*
                 * Entramos por el EAST.
                 */
                cellX = width - 2;
                cellY = this.currentChunk.connections.east.position;

                break;

            case "south":
                /*
                 * Entramos por el NORTH.
                 */
                cellX = this.currentChunk.connections.north.position;
                cellY = 1;

                break;

            case "north":
                /*
                 * Entramos por el SOUTH.
                 */
                cellX = this.currentChunk.connections.south.position;
                cellY = height - 2;

                break;
        }

        const entryCell = this.findNearestWalkableCell(
            grid,
            cellX,
            cellY
        );

        const x =
            offset.x +
            entryCell.x * this.tileSize +
            this.tileSize / 2;

        const y =
            offset.y +
            entryCell.y * this.tileSize +
            this.tileSize / 2;

        this.player.setPosition(
            x,
            y
        );

        this.player.setActive(true);
        this.player.setVisible(true);
        this.player.setAlpha(1);

        const body =
            this.player.body;

        if (
            body &&
            body instanceof Phaser.Physics.Arcade.Body
        ) {
            body.enable = true;
            body.updateFromGameObject();
            body.setVelocity(0, 0);
        }
    }

    private findNearestWalkableCell(
        grid: number[][],
        targetX: number,
        targetY: number
    ): { x: number; y: number } {
        if (grid[targetY]?.[targetX] === 0) {
            return {
                x: targetX,
                y: targetY,
            };
        }

        let nearest = {
            x: 1,
            y: 1,
        };
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (let y = 1; y < grid.length - 1; y++) {
            for (let x = 1; x < grid[y].length - 1; x++) {
                if (grid[y][x] !== 0) {
                    continue;
                }

                const distance =
                    Math.abs(x - targetX) +
                    Math.abs(y - targetY);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = { x, y };
                }
            }
        }

        return nearest;
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
            const oldOffset = this.currentOffset;

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

        this.currentOffset =
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
                this.currentOffset.x + localX,
                this.currentOffset.y + localY
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