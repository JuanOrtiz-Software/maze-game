import Phaser from "phaser";

import { Chunk } from "./world/types/ChunkTypes";

export class CollisionSystem {
    private readonly scene: Phaser.Scene;

    private wallObjects:
        Phaser.GameObjects.Rectangle[] = [];

    private colliders:
        Phaser.Physics.Arcade.Collider[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Configura el cuerpo físico del jugador.
     */
    public configurePlayer(
        player: Phaser.Physics.Arcade.Sprite,
        tileSize: number
    ): void {
        const body = player.body;

        if (!body || !(body instanceof Phaser.Physics.Arcade.Body)) {
            throw new Error(
                "Player does not have a dynamic Arcade Physics Body."
            );
        }

        body.setSize(
            tileSize * 0.55,
            tileSize * 0.65,
            true
        );

        body.setAllowGravity(false);

        /*
         * Es importante permitir que el jugador
         * salga por las conexiones de los chunks.
         */
        body.setCollideWorldBounds(false);

        body.setBounce(0, 0);
    }

    /**
     * Construye los cuerpos físicos correspondientes
     * a las paredes del chunk.
     */
    public buildWalls(
        chunk: Chunk,
        tileSize: number,
        offset: {
            x: number;
            y: number;
        }
    ): void {
        this.clearWalls();

        const grid =
            chunk.maze.grid;

        for (
            let y = 0;
            y < grid.length;
            y++
        ) {
            for (
                let x = 0;
                x < grid[y].length;
                x++
            ) {
                /*
                 * 0 = camino
                 * 1 = pared
                 */
                if (grid[y][x] !== 1) {
                    continue;
                }

                const wall =
                    this.scene.add.rectangle(
                        offset.x +
                            x * tileSize +
                            tileSize / 2,

                        offset.y +
                            y * tileSize +
                            tileSize / 2,

                        tileSize,
                        tileSize,

                        0x000000,
                        0
                    );

                /*
                 * El objeto existe solamente para
                 * proporcionar el cuerpo físico.
                 */
                wall.setVisible(false);

                this.scene.physics.add.existing(
                    wall,
                    true
                );

                this.wallObjects.push(wall);
            }
        }
    }

    /**
     * Conecta un actor con las paredes actuales.
     *
     * Esto permite reutilizar el sistema posteriormente
     * para enemigos.
     */
    public addActor(
        actor: Phaser.Physics.Arcade.Sprite
    ): void {
        const collider =
            this.scene.physics.add.collider(
                actor,
                this.wallObjects
            );

        this.colliders.push(collider);
    }

    /**
     * Elimina las paredes y sus colisiones actuales.
     */
    public clearWalls(): void {
        for (
            const collider
            of this.colliders
        ) {
            collider.destroy();
        }

        this.colliders = [];

        for (
            const wall
            of this.wallObjects
        ) {
            wall.destroy();
        }

        this.wallObjects = [];
    }

    /**
     * Libera todos los recursos.
     */
    public destroy(): void {
        this.clearWalls();
    }
}