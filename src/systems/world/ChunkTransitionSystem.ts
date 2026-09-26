import Phaser from "phaser";

import {
    Chunk,
    ChunkCoordinates,
} from "./types/ChunkTypes";

export type ChunkTransitionDirection =
    | "north"
    | "south"
    | "east"
    | "west";

export interface ChunkTransition {
    direction: ChunkTransitionDirection;

    targetChunk: ChunkCoordinates;
}

export class ChunkTransitionSystem {
    public detectTransition(
        player: Phaser.Physics.Arcade.Sprite,
        chunk: Chunk,
        offset: {
            x: number;
            y: number;
        },
        tileSize: number
    ): ChunkTransition | null {
        const body =
            player.body;

        if (
            !body ||
            !(body instanceof Phaser.Physics.Arcade.Body)
        ) {
            return null;
        }

        const width =
            chunk.maze.grid[0].length;

        const height =
            chunk.maze.grid.length;

        const left =
            offset.x;

        const right =
            offset.x +
            width * tileSize;

        const top =
            offset.y;

        const bottom =
            offset.y +
            height * tileSize;

        const bodyLeft =
            body.x;

        const bodyRight =
            body.x +
            body.width;

        const bodyTop =
            body.y;

        const bodyBottom =
            body.y +
            body.height;

        /*
         * EAST
         */
        if (
            bodyRight > right &&
            this.isAtConnection(
                player.y,
                offset.y,
                chunk.connections.east.position,
                tileSize
            )
        ) {
            return {
                direction: "east",

                targetChunk: {
                    x: chunk.coordinates.x + 1,
                    y: chunk.coordinates.y,
                },
            };
        }

        /*
         * WEST
         */
        if (
            bodyLeft < left &&
            this.isAtConnection(
                player.y,
                offset.y,
                chunk.connections.west.position,
                tileSize
            )
        ) {
            return {
                direction: "west",

                targetChunk: {
                    x: chunk.coordinates.x - 1,
                    y: chunk.coordinates.y,
                },
            };
        }

        /*
         * SOUTH
         */
        if (
            bodyBottom > bottom &&
            this.isAtConnection(
                player.x,
                offset.x,
                chunk.connections.south.position,
                tileSize
            )
        ) {
            return {
                direction: "south",

                targetChunk: {
                    x: chunk.coordinates.x,
                    y: chunk.coordinates.y + 1,
                },
            };
        }

        /*
         * NORTH
         */
        if (
            bodyTop < top &&
            this.isAtConnection(
                player.x,
                offset.x,
                chunk.connections.north.position,
                tileSize
            )
        ) {
            return {
                direction: "north",

                targetChunk: {
                    x: chunk.coordinates.x,
                    y: chunk.coordinates.y - 1,
                },
            };
        }

        return null;
    }

    private isAtConnection(
        coordinate: number,
        offset: number,
        position: number,
        tileSize: number
    ): boolean {
        const connectionCenter =
            offset +
            position * tileSize +
            tileSize / 2;

        const tolerance =
            tileSize * 0.45;

        return (
            Math.abs(
                coordinate -
                connectionCenter
            ) <= tolerance
        );
    }
}