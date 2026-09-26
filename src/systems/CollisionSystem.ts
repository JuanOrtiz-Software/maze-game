import Phaser from "phaser";

import { Chunk } from "./world/types/ChunkTypes";

export class CollisionSystem {
    private readonly scene: Phaser.Scene;

    private wallObjects:
        Phaser.GameObjects.Rectangle[] = [];

    private wallPool:
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

        const grid = chunk.maze.grid;

        for (let y = 0; y < grid.length; y++) {
            let x = 0;

            while (x < grid[y].length) {
                if (grid[y][x] !== 1) {
                    x++;
                    continue;
                }

                const startX = x;

                while (x < grid[y].length && grid[y][x] === 1) {
                    x++;
                }

                const width = (x - startX) * tileSize;
                const centerX =
                    offset.x + startX * tileSize + width / 2;
                const centerY =
                    offset.y + y * tileSize + tileSize / 2;
                const wall = this.acquireWall(
                    centerX,
                    centerY,
                    width,
                    tileSize
                );

                this.wallObjects.push(wall);
            }
        }
    }

    private acquireWall(
        centerX: number,
        centerY: number,
        width: number,
        height: number
    ): Phaser.GameObjects.Rectangle {
        const wall =
            this.wallPool.pop() ??
            this.scene.add.rectangle(
                centerX,
                centerY,
                width,
                height,
                0,
                0
            );

        wall.setActive(true);
        wall.setVisible(false);
        wall.setPosition(centerX, centerY);
        wall.setSize(width, height);

        if (
            !wall.body ||
            !(wall.body instanceof Phaser.Physics.Arcade.StaticBody)
        ) {
            this.scene.physics.add.existing(wall, true);
        }

        const body = wall.body;

        if (
            body &&
            body instanceof Phaser.Physics.Arcade.StaticBody
        ) {
            body.enable = true;
            body.setSize(width, height);
            body.reset(centerX, centerY);
        }

        return wall;
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
            wall.setActive(false);
            wall.setVisible(false);

            const body = wall.body;

            if (
                body &&
                body instanceof Phaser.Physics.Arcade.StaticBody
            ) {
                body.enable = false;
            }

            this.wallPool.push(wall);
        }

        this.wallObjects = [];
    }

    /**
     * Libera todos los recursos.
     */
    public destroy(): void {
        this.clearWalls();

        for (const wall of this.wallPool) {
            wall.destroy();
        }

        this.wallPool = [];
    }
}