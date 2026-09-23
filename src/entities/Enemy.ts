export class Enemy {
  public x = 0;
  public y = 0;
  public speed = 60;

  constructor(x = 0, y = 0, speed = 60) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }
}

export default Enemy;
