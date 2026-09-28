import Phaser from "phaser";

import { Chunk } from "./world/types/ChunkTypes";

export class CollisionSystem {
    private readonly scene: Phaser.Scene;

    // We store the walls for each chunk separately
    private chunkWallsMap: Map<string, Phaser.GameObjects.Rectangle[]> = new Map();

    private wallPool:
        Phaser.GameObjects.Rectangle[] = [];

    // Store active colliders per chunk (or global)
    // Actually, one global collider with an array of all active walls is easier, but let's just create a collider per chunk
    private chunkCollidersMap: Map<string, Phaser.Physics.Arcade.Collider> = new Map();

    // Keep track of the actors so we can create colliders when new chunks are added
    private actors: Phaser.Physics.Arcade.Sprite[] = [];

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
     * a las paredes de un chunk específico.
     */
    public buildWalls(
        chunk: Chunk,
        tileSize: number
    ): void {
        const key = `${chunk.coordinates.x},${chunk.coordinates.y}`;
        if (this.chunkWallsMap.has(key)) {
            return;
        }

        const grid = chunk.maze.grid;
        const width = grid[0].length;
        const height = grid.length;

        const offsetX = chunk.coordinates.x * width * tileSize;
        const offsetY = chunk.coordinates.y * height * tileSize;

        const newWalls: Phaser.GameObjects.Rectangle[] = [];

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

                const wallWidth = (x - startX) * tileSize;
                const centerX =
                    offsetX + startX * tileSize + wallWidth / 2;
                const centerY =
                    offsetY + y * tileSize + tileSize / 2;
                const wall = this.acquireWall(
                    centerX,
                    centerY,
                    wallWidth,
                    tileSize
                );

                newWalls.push(wall);
            }
        }

        this.chunkWallsMap.set(key, newWalls);

        // Si ya hay actores, creamos el collider para este nuevo chunk
        if (this.actors.length > 0) {
            const collider = this.scene.physics.add.collider(this.actors, newWalls);
            this.chunkCollidersMap.set(key, collider);
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
            body.updateFromGameObject();
        }

        return wall;
    }

    /**
     * Conecta un actor con el sistema de colisiones.
     */
    public addActor(
        actor: Phaser.Physics.Arcade.Sprite
    ): void {
        if (!this.actors.includes(actor)) {
            this.actors.push(actor);
            
            // Recreamos los colliders para este nuevo actor (o lo añadimos a un grupo)
            // Para simplificar, si agregamos un actor nuevo, iteramos sobre los chunks existentes
            for (const [key, walls] of this.chunkWallsMap.entries()) {
                const existingCollider = this.chunkCollidersMap.get(key);
                if (existingCollider) {
                    existingCollider.destroy();
                }
                const collider = this.scene.physics.add.collider(this.actors, walls);
                this.chunkCollidersMap.set(key, collider);
            }
        }
    }

    /**
     * Elimina las paredes de un chunk específico.
     */
    public removeChunk(coordinates: {x: number, y: number}): void {
        const key = `${coordinates.x},${coordinates.y}`;
        
        const collider = this.chunkCollidersMap.get(key);
        if (collider) {
            collider.destroy();
            this.chunkCollidersMap.delete(key);
        }

        const walls = this.chunkWallsMap.get(key);
        if (walls) {
            for (const wall of walls) {
                wall.setActive(false);
                wall.setVisible(false);

                const body = wall.body;
                if (body && body instanceof Phaser.Physics.Arcade.StaticBody) {
                    body.enable = false;
                }
                this.wallPool.push(wall);
            }
            this.chunkWallsMap.delete(key);
        }
    }

    /**
     * Elimina TODAS las paredes.
     */
    public clearWalls(): void {
        for (const collider of this.chunkCollidersMap.values()) {
            collider.destroy();
        }
        this.chunkCollidersMap.clear();

        for (const walls of this.chunkWallsMap.values()) {
            for (const wall of walls) {
                wall.setActive(false);
                wall.setVisible(false);

                const body = wall.body;
                if (body && body instanceof Phaser.Physics.Arcade.StaticBody) {
                    body.enable = false;
                }
                this.wallPool.push(wall);
            }
        }
        this.chunkWallsMap.clear();
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