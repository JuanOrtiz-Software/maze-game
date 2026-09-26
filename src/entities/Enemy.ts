import Phaser from "phaser";
import { Player } from "./Player";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly speed = 100;
  private readonly frameDelay = 150;
  private readonly player: Player;
  private animationFrame = 1;
  private frameTimer = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
  ) {
    super(scene, x, y, "villano1_der");

    this.player = player;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.25);
    this.setCollideWorldBounds(false);
    this.setDepth(40);
  }

  update(_time: number, delta: number): void {
    this.scene.physics.moveToObject(this, this.player, this.speed);

    const direction = this.player.x < this.x ? "izq" : "der";
    this.setTexture(`villano${this.animationFrame}_${direction}`);

    this.frameTimer += delta;
    if (this.frameTimer >= this.frameDelay) {
      this.frameTimer = 0;
      this.animationFrame = this.animationFrame >= 5
        ? 1
        : this.animationFrame + 1;
    }
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.animationFrame = 1;
    this.frameTimer = 0;
    this.setTexture("villano1_der");

    const body = this.body;
    if (body && body instanceof Phaser.Physics.Arcade.Body) {
      body.updateFromGameObject();
      body.setVelocity(0, 0);
    }
  }
}

export default Enemy;
