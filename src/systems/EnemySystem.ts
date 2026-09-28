import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Chunk } from "./world/types/ChunkTypes";

export class EnemySystem {
  private readonly minimumSpawnDistance = 180;
  private enemy?: Enemy;
  private overlap?: Phaser.Physics.Arcade.Collider;
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly onPlayerCaught: () => void,
  ) {}

  setChunk(
    chunk: Chunk,
    tileSize: number,
    offset: { x: number; y: number },
  ): void {
    const position = this.getSpawnPosition(chunk, tileSize, offset);
    this.stopped = false;

    if (this.enemy) {
      this.enemy.respawn(position.x, position.y);
      return;
    }

    this.enemy = new Enemy(
      this.scene,
      position.x,
      position.y,
      this.player,
    );

    this.overlap = this.scene.physics.add.overlap(
      this.enemy,
      this.player,
      this.onPlayerCaught,
    );
  }

  update(time: number, delta: number): void {
    if (!this.stopped) {
      this.enemy?.update(time, delta);
    }
  }

  stop(): void {
    this.stopped = true;
    this.overlap?.destroy();
    this.overlap = undefined;

    if (!this.enemy) {
      return;
    }

    const body = this.enemy.body;
    if (body && body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.enemy.setActive(false);
    this.enemy.setVisible(false);
  }

  private getSpawnPosition(
    chunk: Chunk,
    tileSize: number,
    offset: { x: number; y: number },
  ): { x: number; y: number } {
    const walkableCells: Array<{ x: number; y: number }> = [];
    const grid = chunk.maze.grid;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 0) {
          walkableCells.push({ x, y });
        }
      }
    }

    Phaser.Utils.Array.Shuffle(walkableCells);

    const spawnCell = walkableCells.find((cell) => {
      const x = offset.x + cell.x * tileSize + tileSize / 2;
      const y = offset.y + cell.y * tileSize + tileSize / 2;

      return Phaser.Math.Distance.Between(
        x,
        y,
        this.player.x,
        this.player.y,
      ) >= this.minimumSpawnDistance;
    }) ?? walkableCells[0];

    if (!spawnCell) {
      return { x: this.player.x, y: this.player.y };
    }

    const x = offset.x + spawnCell.x * tileSize + tileSize / 2;
    const y = offset.y + spawnCell.y * tileSize + tileSize / 2;

    return { x, y };
  }
}

export default EnemySystem;
